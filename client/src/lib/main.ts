import { TankiAPI } from './api';
import { CONTROLS } from './const';
import { Lobby } from './lobby';
import type { IPresenceMessage, ServerMessage } from './types';

export class Tanki {

    private api = new TankiAPI();
    private player = this.ruffle?.createPlayer();
    private runtime = this.player?.ruffle();
    private held = new Set<string>();
    private ready = false;
    private loaded = false;
    private ended = false;
    private paired = false;
    private assignment: IPresenceMessage | null = null;
    private bootstrapReady = false;
    private started = false;
    private generation = 0;
    private selectedId: string | null = null;
    private socket: WebSocket | null = null;
    private preloadQueue: Promise<void> = Promise.resolve();

    private get gameContainer() {
        const element = document.querySelector<HTMLDivElement>('#game');

        if (!element) {
            throw new Error('No game container element');
        }

        return element;
    }

    private get statusElement() {
        const element = document.querySelector<HTMLParagraphElement>('#status');

        if (!element) {
            throw new Error('No status element');
        }

        return element;
    }

    private get ruffle() {
        return window.RufflePlayer?.newest();
    }

    private releaseKeys() {
        for (const code of this.held) {
            this.runtime?.callExternalInterface('setKeyState', code, false);
        }
        this.held.clear();
    }

    private pauseGame() {
        this.ready = false;
        this.releaseKeys();
        this.runtime?.suspend();
        this.gameContainer.hidden = true;
    }

    private startIfReady() {
        if (!this.loaded || !this.paired || this.ended || !this.assignment) {
            return;
        }

        this.gameContainer.hidden = false;
        this.runtime?.resume();
        if (!this.bootstrapReady) {
            return;
        }

        if (!this.started) {
            this.runtime?.callExternalInterface(
                'startGame',
                this.assignment.color,
                this.assignment.tanks.green,
                this.assignment.tanks.red,
            );
            this.started = true;
        }

        this.ready = true;
        this.statusElement.textContent = `Two players connected. Game started. You control the ${this.assignment.color} tank.`;
    }

    private preload(token: number, swf: Promise<ArrayBuffer>) {
        this.loaded = false;
        this.bootstrapReady = false;
        this.started = false;
        this.ended = false;

        this.preloadQueue = this.preloadQueue.then(async () => {
            const data = await swf;
            if (token !== this.generation || !this.runtime) {
                return;
            }

            this.bootstrapReady = false;
            await this.runtime.load({
                data,
                swfFileName: 'game.swf',
                autoplay: 'off',
                unmuteOverlay: 'hidden',
                backgroundColor: '#0f172a',
                allowScriptAccess: true,
            });

            if (token !== this.generation) {
                return;
            }

            this.runtime.traceObserver = (message) => {
                console.log(`[AS3] ${message}`);
            };
            this.loaded = true;

            if (this.paired) {
                this.startIfReady();
            } else if (!this.selectedId) {
                this.statusElement.textContent = 'Select a game or create one to join.';
            }
        }).catch((error: unknown) => {
            if (token !== this.generation) {
                return;
            }
            this.loaded = false;
            this.pauseGame();
            this.statusElement.textContent = 'Unable to load the game. Reload the page to try again.';
            console.error('Game preload failed:', error);
        });
    }

    private selectGame(id: string | null, swf: Promise<ArrayBuffer>) {
        if (id === this.selectedId && this.socket && this.socket.readyState <= WebSocket.OPEN) {
            return;
        }

        this.generation += 1;
        this.selectedId = id;
        this.paired = false;
        this.assignment = null;
        this.pauseGame();
        const previous = this.socket;
        this.socket = null;
        previous?.close();
        this.preload(this.generation, swf);

        if (!id) {
            this.statusElement.textContent = 'Select a game or create one to join.';
            return;
        }

        this.statusElement.textContent = 'Connecting to game';
        const connection = this.api.connectGame(id);
        this.socket = connection;
        this.socket.addEventListener('message', (event: MessageEvent<string>) => {
            if (this.socket !== connection) {
                return;
            }
            let message: ServerMessage;
            try {
                message = JSON.parse(event.data) as ServerMessage;
            } catch {
                return;
            }

            if (message.type === 'state') {
                if (this.started && !this.ended) {
                    this.runtime?.callExternalInterface('applyState', message.state);
                }
                return;
            }

            this.assignment = message;
            this.paired = this.assignment.players === 2;
            if (!this.paired) {
                this.pauseGame();
                this.statusElement.textContent = `Waiting for another player (1/2)… You control the ${this.assignment.color} tank.`;
            } else if (this.ended) {
                this.statusElement.textContent = 'Game over — a tank was hit.';
            } else {
                this.statusElement.textContent = 'Preparing game for two players…';
                this.startIfReady();
            }
        });

        connection.addEventListener('error', () => {
            if (this.socket !== connection) {
                return;
            }

            this.paired = false;
            this.assignment = null;
            this.pauseGame();
            this.statusElement.textContent = 'Unable to connect to the game server.';
        });

        connection.addEventListener('close', (event) => {
            if (this.socket !== connection) {
                return;
            }

            this.socket = null;
            this.paired = false;
            this.assignment = null;
            this.pauseGame();
            this.statusElement.textContent = event.reason || 'Disconnected. Select the game again to reconnect.';
        });
    }

    private handleKey(event: KeyboardEvent, pressed: boolean) {
        if (
            !this.ready
            || document.activeElement !== this.player
            || !CONTROLS.has(event.code)) {
            return;
        }

        event.preventDefault();

        if (this.held.has(event.code) === pressed) {
            return;
        }

        if (pressed) {
            this.held.add(event.code);
        } else {
            this.held.delete(event.code);
        }

        this.runtime?.callExternalInterface('setKeyState', event.code, pressed);
    }

    public initializePage() {
        if (!this.player) {
            this.statusElement.textContent = 'Ruffle did not load. Reload the page to try again.';
            const lobby = new Lobby(this.api, () => {
                this.statusElement.textContent = 'Ruffle did not load. Reload the page to try again.';
            });
            lobby.initializePage();
            return;
        }

        this.gameContainer.replaceChildren(this.player);

        const swf = fetch(new URL('/game.swf', document.baseURI)).then((response) => {
            if (!response.ok) {
                throw new Error(`SWF download failed (${response.status}).`);
            }
            return response.arrayBuffer();
        });

        window.onTankiReady = () => {
            this.bootstrapReady = true;
            queueMicrotask(() => {
                this.startIfReady();
            });
        };
        window.onTankiGameOver = () => {
            this.ended = true;
            this.ready = false;
            this.held.clear();
            this.statusElement.textContent = 'Game over';
        };
        window.onTankiSync = (state) => {
            if (!this.ready || !this.socket || !this.assignment) {
                return;
            }

            this.api.sendGameState(this.socket, this.assignment.color, state);
        };

        this.player.addEventListener('loadedmetadata', () => {
            const metadata = this.runtime?.metadata;

            if (metadata && metadata.width > 0 && metadata.height > 0) {
                this.gameContainer.style.aspectRatio = `${metadata.width} / ${metadata.height}`;
            }
        });

        this.player.tabIndex = 0;
        this.player.addEventListener('pointerdown', () => this.player?.focus());

        window.addEventListener('keydown', (event) => {
            this.handleKey(event, true);
        }, true);
        window.addEventListener('keyup', (event) => {
            this.handleKey(event, false);
        }, true);
        this.player.addEventListener('focusout', () => {
            this.releaseKeys();
        });
        window.addEventListener('blur', () => {
            this.releaseKeys();
        });
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.releaseKeys();
            }
        });

        window.addEventListener('pagehide', () => {
            const previous = this.socket;
            this.socket = null;
            previous?.close();
        });

        const lobby = new Lobby(this.api, (id) => {
            this.selectGame(id, swf);
        });
        lobby.initializePage();
    }
}

const tanki = new Tanki();
tanki.initializePage();
