import uuid

class Game:
    game_storage = {}

    def __init__(self):
        pass

    @staticmethod
    def clear():
        Game.game_storage = {}

    @staticmethod
    def new_game():
        game_id = str(uuid.uuid4())
        # TODO: Create game instance
        Game.game_storage[game_id] = {}
        return game_id