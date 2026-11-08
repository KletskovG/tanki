// TODO: Eslint

import {TankiAPI} from './api';

async function startGame(): Promise<void> {
  const gameContainer = document.querySelector("#game");
  const statusElement = document.querySelector("#status");

  if (!gameContainer || !statusElement) {
    throw new Error(`Missing some of required elements, ${gameContainer}, ${statusElement}`);
  }

  try {
    const ruffle = window.RufflePlayer?.newest();

    if (!ruffle) {
      throw new Error("Ruffle did not load.");
    }

    const player = ruffle.createPlayer();
    gameContainer.replaceChildren(player);

    const ruffleAPI = player.ruffle();
    
    const controls = new Set(["KeyW", "KeyA", "KeyS", "KeyD"]);
    const held = new Set<string>();
    let ready = false;

    Object.assign(window, {
      onTankiReady(): void {
        ready = true;
      },
    });

    player.tabIndex = 0;
    player.addEventListener("pointerdown", () => player.focus());
    window.addEventListener("keydown", (event) => handleKey(ready, player, event, true, controls, held, ruffleAPI), true);
    window.addEventListener("keyup", (event) => handleKey(ready, player, event, false, controls, held, ruffleAPI), true);

    // player.addEventListener("focusout", releaseKeys);
    // window.addEventListener("blur", releaseKeys);
    // document.addEventListener("visibilitychange", () => {
    //   if (document.hidden) releaseKeys();
    // });

    await ruffleAPI.load({
      url: new URL("./game.swf", document.baseURI).href,
      autoplay: "off",
      unmuteOverlay: "hidden",
      backgroundColor: "#0f172a",
      allowScriptAccess: true,
    });

    ruffleAPI.traceObserver = (message) => console.log(`[ActionScript 3] ${message}`);
    ruffleAPI.resume();

    // player.onk

    statusElement.textContent = "Game loaded.";
  } catch (error: unknown) {
    console.error("Failed to start the game:", error);
    statusElement.textContent = "Unable to load the game. Check the browser console.";
  }
}

function handleKey(
  ready: boolean,
  player: RufflePlayerElement,
  event: KeyboardEvent,
  pressed: boolean,
  controls: Set<string>,
  held: Set<string>,
  ruffleAPI: RufflePlayerApi,
): void {
  if (!ready || document.activeElement !== player) return;
  if (!controls.has(event.code)) return;

  event.preventDefault();

  // Ignore repeated keydown events and redundant releases.
  if (held.has(event.code) === pressed) return;

  if (pressed) {
    held.add(event.code);
  } else {
    held.delete(event.code);
  }

  ruffleAPI.callExternalInterface("setKeyState", event.code, pressed);
}

function releaseKeys(ruffleAPI: RufflePlayerApi, held: Set<string>): void {
  for (const code of held) {
    ruffleAPI.callExternalInterface("setKeyState", code, false);
  }
  held.clear();
}

startGame();
console.log("API?")

const api = new TankiAPI();
api.newGame()
  .then(console.log)
  .then(() => {
    api.clearGames();
  })