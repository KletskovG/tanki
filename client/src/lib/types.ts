export type TankColor = 'green' | 'red';

export interface IPresenceMessage {
    type: 'presence';
    players: 1 | 2;
    color: TankColor;
    tanks: Record<TankColor, string>;
}

export interface IVectorState {
    x: number;
    y: number;
}

export interface IRectangleState extends IVectorState {
    width: number;
    height: number;
}

export interface ITankState extends IVectorState {
    id: string;
    color: TankColor;
    rotation: number;
}

export interface IProjectileState extends IVectorState {
    id: string;
    parent: string;
    rotation: number;
    direction: IVectorState;
    speed: number;
}

export interface IGameWorldState {
    bounds: IRectangleState;
    tanks: ITankState[];
    walls: IRectangleState[];
    projectiles: IProjectileState[];
    stopped: boolean;
}

export interface IGameStateMessage {
    type: 'sync';
    color: TankColor;
    state: IGameWorldState;
}

export interface IServerStateMessage {
    type: 'state';
    state: IGameWorldState;
}

export type ServerMessage = IPresenceMessage | IServerStateMessage;
