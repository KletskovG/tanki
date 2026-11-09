from dataclasses import dataclass
from typing import Literal

TankColor = Literal["green", "red"]

@dataclass
class VectorState:
    x: float
    y: float

@dataclass
class RectangleState(VectorState):
    width: float
    height: float

@dataclass
class TankState(VectorState):
    id: str
    color: TankColor
    rotation: float

@dataclass
class ProjectileState(VectorState):
    id: str
    parent: str
    rotation: float
    direction: VectorState
    speed: float

@dataclass
class GameWorldState:
    bounds: RectangleState
    tanks: list[TankState]
    walls: list[RectangleState]
    projectiles: list[ProjectileState]
    stopped: bool


@dataclass
class GameStateMessage:
    type: Literal["sync"]
    color: TankColor
    state: GameWorldState


@dataclass
class ServerStateMessage:
    type: Literal["state"]
    state: GameWorldState
