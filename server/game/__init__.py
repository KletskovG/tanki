import uuid
from copy import deepcopy
from typing import Optional

from game.state import GameWorldState, TankColor, TankState, ProjectileState

class Game:
    TANK_COLORS = ("green", "red")
    game_storage: dict[str, "Game"] = {}

    def __init__(self):
        self.tanks: dict[str, str] = {}
        self.player_states: dict[TankColor, GameWorldState] = {}
        self.server_state: Optional[GameWorldState] = None

        for color in self.TANK_COLORS:
            self.tanks[color] = str(uuid.uuid4())

    def merge_states(self) -> Optional[GameWorldState]:
        if not self.player_states:
            return None

        base = self.server_state or next(iter(self.player_states.values()))

        tanks: dict[str, TankState] = {}
        for tank in base.tanks:
            if self.tanks.get(tank.color) == tank.id:
                tanks[tank.id] = tank

        for color, state in self.player_states.items():
            for tank in state.tanks:
                if tank.id == self.tanks[color] and tank.color == color:
                    tanks[tank.id] = tank

        tanks_copy: list[TankState] = []
        for tank_id in self.tanks.values():
            if tank_id in tanks:
                tanks_copy.append(deepcopy(tanks[tank_id]))

        projectiles_copy: list[ProjectileState] = []
        for color in self.TANK_COLORS:
            if color not in self.player_states:
                continue
            
            for projectile in self.player_states[color].projectiles:
                if projectile.parent == self.tanks[color]:
                    projectiles_copy.append(deepcopy(projectile))

        stopped = False
        for state in self.player_states.values():
            if state.stopped:
                stopped = True
        
        self.server_state = GameWorldState(
            bounds=deepcopy(base.bounds),
            tanks=tanks_copy,
            walls=deepcopy(base.walls),
            projectiles=projectiles_copy,
            stopped=stopped,
        )
        return self.server_state

    @staticmethod
    def clear():
        Game.game_storage = {}

    @staticmethod
    def new_game():
        game_id = str(uuid.uuid4())
        Game.game_storage[game_id] = Game()
        return game_id
