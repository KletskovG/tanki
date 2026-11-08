from fastapi import APIRouter, Response, WebSocket, WebSocketDisconnect, status
from game import Game
from game.connections import GameConnections

router = APIRouter()
connections = GameConnections()

# TODO: Move handlers into files

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
    except WebSocketDisconnect:
        pass
    finally:
        await connections.disconnect(game_id, socket)
