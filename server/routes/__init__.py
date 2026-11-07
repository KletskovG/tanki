from fastapi import APIRouter, Response, status
from game import Game

router = APIRouter()

# TODO: Move handlers into files

@router.get('/clear')
def clear():
    Game.clear()
    return Response(status_code=status.HTTP_200_OK)

@router.get('/games')
def games():
    return Response(
        status_code=status.HTTP_200_OK,
        content=dict(
           keys=str(Game.game_storage.keys())
        )
    )

@router.get('/new')
def new():
    game = Game.new_game()
    return Response(
        status_code=status.HTTP_200_OK,
        content=game,
    )