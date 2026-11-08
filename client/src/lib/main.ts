import { TankiAPI } from "./api";
import { initializeLobby } from "./lobby";

function element<T extends HTMLElement>(selector: string): T {
  const node = document.querySelector<T>(selector);
  if (!node) throw new Error(`Missing game element: ${selector}`);
  return node;
}

function initializePage(): void {
  const gameContainer = element<HTMLDivElement>("#game");
  const status = element<HTMLParagraphElement>("#status");
  const ruffle = window.RufflePlayer?.newest();
  if (!ruffle) {
    status.textContent = "Ruffle did not load. Reload the page to try again.";
    return;
  }

  const api = new TankiAPI();
  const player = ruffle.createPlayer();
  gameContainer.replaceChildren(player);
  const runtime = player.ruffle();
  const controls = new Set(["KeyW", "KeyA", "KeyS", "KeyD", "Space"]);
  const held = new Set<string>();
  let socket: WebSocket | null = null;
  let selectedId: string | null = null;
  let generation = 0;
  let ready = false;
  let loaded = false;
  let bootstrapReady = false;
  let started = false;
  let ended = false;
  let paired = false;
  let preloadQueue: Promise<void> = Promise.resolve();

  // Download once, before navigation changes the current /game/<id> URL.
  const swf = fetch(new URL("./game.swf", document.baseURI)).then((response) => {
    if (!response.ok) throw new Error(`SWF download failed (${response.status}).`);
    return response.arrayBuffer();
  });

  function releaseKeys(): void {
    for (const code of held) runtime.callExternalInterface("setKeyState", code, false);
    held.clear();
  }

  function pauseGame(): void {
    ready = false;
    releaseKeys();
    runtime.suspend();
    gameContainer.hidden = true;
  }

  function startIfReady(): void {
    if (!loaded || !paired || ended) return;
    gameContainer.hidden = false;
    // The first frame registers the AS3 bridge; startGame creates the map.
    runtime.resume();
    if (!bootstrapReady) return;
    if (!started) {
      runtime.callExternalInterface("startGame");
      started = true;
    }
    ready = true;
    status.textContent = "Two players connected. Game started.";
  }

  function preload(token: number): void {
    loaded = bootstrapReady = started = ended = false;
    // Serialize reloads so rapid room switches cannot revive an older game.
    preloadQueue = preloadQueue.then(async () => {
      const data = await swf;
      if (token !== generation) return;
      bootstrapReady = false;
      await runtime.load({
        data,
        swfFileName: "game.swf",
        autoplay: "off",
        unmuteOverlay: "hidden",
        backgroundColor: "#0f172a",
        allowScriptAccess: true,
      });
      if (token !== generation) return;
      runtime.traceObserver = (message) => console.log(`[ActionScript 3] ${message}`);
      loaded = true;
      if (paired) startIfReady();
      else if (!selectedId) status.textContent = "Select a game or create one to join.";
    }).catch((error: unknown) => {
      if (token !== generation) return;
      pauseGame();
      status.textContent = "Unable to preload the game. Reload the page to try again.";
      console.error("Game preload failed:", error);
    });
  }

  function selectGame(id: string | null): void {
    if (id === selectedId && socket && socket.readyState <= WebSocket.OPEN) return;
    generation++;
    selectedId = id;
    paired = false;
    pauseGame();
    const previous = socket;
    socket = null;
    previous?.close();
    preload(generation);
    if (!id) {
      status.textContent = "Select a game or create one to join.";
      return;
    }

    status.textContent = "Connecting to game…";
    const connection = api.connectGame(id);
    socket = connection;
    connection.addEventListener("message", (event: MessageEvent<string>) => {
      if (socket !== connection) return;
      let message: unknown;
      try {
        message = JSON.parse(event.data);
      } catch {
        return;
      }
      if (!message || typeof message !== "object" || !("type" in message)
        || message.type !== "presence" || !("players" in message)
        || (message.players !== 1 && message.players !== 2)) return;

      paired = message.players === 2;
      if (!paired) {
        pauseGame();
        status.textContent = "Waiting for another player (1/2)…";
      } else if (ended) {
        status.textContent = "Game over — a tank was hit.";
      } else {
        status.textContent = "Preparing game for two players…";
        startIfReady();
      }
    });
    connection.addEventListener("error", () => {
      if (socket !== connection) return;
      paired = false;
      pauseGame();
      status.textContent = "Unable to connect to the game server.";
    });
    connection.addEventListener("close", (event) => {
      if (socket !== connection) return;
      socket = null;
      paired = false;
      pauseGame();
      status.textContent = event.reason || "Disconnected. Select the game again to reconnect.";
    });
  }

  Object.assign(window, {
    onTankiReady(): void {
      bootstrapReady = true;
      queueMicrotask(startIfReady);
    },
    onTankiGameOver(): void {
      ended = true;
      ready = false;
      held.clear();
      status.textContent = "Game over — a tank was hit.";
    },
  });

  player.addEventListener("loadedmetadata", () => {
    const metadata = runtime.metadata;
    if (metadata && metadata.width > 0 && metadata.height > 0) {
      gameContainer.style.aspectRatio = `${metadata.width} / ${metadata.height}`;
    }
  });
  player.tabIndex = 0;
  player.addEventListener("pointerdown", () => player.focus());
  function handleKey(event: KeyboardEvent, pressed: boolean): void {
    if (!ready || document.activeElement !== player || !controls.has(event.code)) return;
    event.preventDefault();
    if (held.has(event.code) === pressed) return;
    if (pressed) held.add(event.code);
    else held.delete(event.code);
    runtime.callExternalInterface("setKeyState", event.code, pressed);
  }
  window.addEventListener("keydown", (event) => handleKey(event, true), true);
  window.addEventListener("keyup", (event) => handleKey(event, false), true);
  player.addEventListener("focusout", releaseKeys);
  window.addEventListener("blur", releaseKeys);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) releaseKeys();
  });
  window.addEventListener("pagehide", () => {
    const previous = socket;
    socket = null;
    previous?.close();
  });

  preload(generation);
  initializeLobby(api, selectGame);
}

initializePage();
