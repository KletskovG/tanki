from dataclasses import asdict

from fastapi import APIRouter, Response, WebSocket, WebSocketDisconnect, status
from pydantic import TypeAdapter, ValidationError
from game import Game
from game.connections import GameConnections
from game.state import GameStateMessage, ServerStateMessage

router = APIRouter()
connections = GameConnections()
state_message_adapter = TypeAdapter(GameStateMessage)

@router.get('/clear')
async def clear():
    Game.clear()
    await connections.close_all()
    return Response(status_code=status.HTTP_200_OK)

@router.get('/games')
def games():
    return list(Game.game_storage.keys())

@router.get('/new')
def new():
    game = Game.new_game()
    return Response(
        status_code=status.HTTP_200_OK,
        content=game,
    )

@router.websocket('/game/{game_id}')
async def connect_game(socket: WebSocket, game_id: str):
    if not await connections.connect(game_id, socket):
        return
    try:
        while True:
            message = await socket.receive()
            if message['type'] == 'websocket.disconnect':
                break
            if message['type'] != 'websocket.receive' or message.get('text') is None:
                continue

            try:
                state_message = state_message_adapter.validate_json(message['text'], strict=True)
            except ValidationError:
                continue

            server_state = await connections.store_state(game_id, socket, state_message)
            if server_state is not None:
                await socket.send_json(asdict(ServerStateMessage(type="state", state=server_state)))
    except (WebSocketDisconnect, RuntimeError, OSError):
        pass
    finally:
        await connections.disconnect(game_id, socket)
