import asyncio

from fastapi import WebSocket, WebSocketDisconnect

from game import Game


class GameConnections:
    """Tracks open sockets only; no simulation or gameplay messages."""

    def __init__(self):
        self.rooms: dict[str, set[WebSocket]] = {}
        self._lock = None

    @property
    def lock(self) -> asyncio.Lock:
        # Python 3.9 binds locks to a loop at creation; imports run before Uvicorn's loop.
        if self._lock is None:
            self._lock = asyncio.Lock()
        return self._lock

    async def connect(self, game_id: str, socket: WebSocket) -> bool:
        await socket.accept()
        async with self.lock:
            if game_id not in Game.game_storage:
                await socket.close(code=1008, reason="Game not found.")
                return False
            peers = self.rooms.setdefault(game_id, set())
            if len(peers) >= 2:
                await socket.close(code=1008, reason="This game already has two players.")
                return False
            peers.add(socket)
            await self.notify(game_id)
            return True

    async def disconnect(self, game_id: str, socket: WebSocket) -> None:
        async with self.lock:
            peers = self.rooms.get(game_id)
            if peers is None:
                return
            peers.discard(socket)
            await self.notify(game_id)

    async def notify(self, game_id: str) -> None:
        # Called under the lock so join/leave notifications stay in order.
        peers = self.rooms.get(game_id, set())
        while peers:
            failed = set()
            for socket in tuple(peers):
                try:
                    await socket.send_json({"type": "presence", "players": len(peers)})
                except (WebSocketDisconnect, RuntimeError):
                    failed.add(socket)
            if not failed:
                return
            peers.difference_update(failed)
        self.rooms.pop(game_id, None)

    async def close_all(self) -> None:
        async with self.lock:
            sockets = [socket for peers in self.rooms.values() for socket in peers]
            self.rooms.clear()
            for socket in sockets:
                try:
                    await socket.close(code=1001, reason="Games cleared.")
                except (WebSocketDisconnect, RuntimeError):
                    pass
