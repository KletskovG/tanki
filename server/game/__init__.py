import uuid

from game.state import GameWorldState, TankColor

class Game:
    TANK_COLORS = ("green", "red")
    game_storage: dict[str, "Game"] = {}

    def __init__(self):
        self.tanks: dict[str, str] = {}
        self.player_states: dict[TankColor, GameWorldState] = {}

        for color in self.TANK_COLORS:
            self.tanks[color] = str(uuid.uuid4())

    @staticmethod
    def clear():
        Game.game_storage = {}

    @staticmethod
    def new_game():
        game_id = str(uuid.uuid4())
        Game.game_storage[game_id] = Game()
        return game_id
