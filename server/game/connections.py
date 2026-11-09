import asyncio
from typing import Optional

from fastapi import WebSocket, WebSocketDisconnect

from game import Game
from game.state import GameStateMessage, GameWorldState


class GameConnections:
    def __init__(self):
        self.rooms: dict[str, dict[WebSocket, str]] = {}
        self._lock = None

    @property
    def lock(self) -> asyncio.Lock:
        if self._lock is None:
            self._lock = asyncio.Lock()
        return self._lock

    async def connect(self, game_id: str, socket: WebSocket) -> bool:
        await socket.accept()
        async with self.lock:
            if game_id not in Game.game_storage:
                await socket.close(code=1008, reason="Game not found.")
                return False
            peers = self.rooms.setdefault(game_id, {})
            if len(peers) >= len(Game.TANK_COLORS):
                await socket.close(code=1008, reason="This game already has two players.")
                return False
            for color in Game.TANK_COLORS:
                if color not in peers.values():
                    peers[socket] = color
                    break
            await self.notify(game_id)
            return socket in peers

    async def disconnect(self, game_id: str, socket: WebSocket) -> None:
        async with self.lock:
            peers = self.rooms.get(game_id)
            if peers is None:
                return
            peers.pop(socket, None)
            await self.notify(game_id)

    async def store_state(self, game_id: str, socket: WebSocket, message: GameStateMessage) -> Optional[GameWorldState]:
        async with self.lock:
            game = Game.game_storage.get(game_id)
            color = self.rooms.get(game_id, {}).get(socket)
            if game is not None and color == message.color:
                game.player_states[message.color] = message.state
                return game.merge_states()
            return None

    async def notify(self, game_id: str) -> None:
        peers = self.rooms.get(game_id, {})
        game = Game.game_storage.get(game_id)
        if game is None:
            return
        while peers:
            failed = set()
            for socket, color in tuple(peers.items()):
                try:
                    await socket.send_json({
                        "type": "presence",
                        "players": len(peers),
                        "color": color,
                        "tanks": game.tanks,
                    })
                except (WebSocketDisconnect, RuntimeError, OSError):
                    failed.add(socket)
            if not failed:
                return
            for socket in failed:
                peers.pop(socket, None)
        self.rooms.pop(game_id, None)

    async def close_all(self) -> None:
        async with self.lock:
            sockets = [socket for peers in self.rooms.values() for socket in peers]
            self.rooms.clear()
            for socket in sockets:
                try:
                    await socket.close(code=1001, reason="Games cleared.")
                except (WebSocketDisconnect, RuntimeError, OSError):
                    pass
