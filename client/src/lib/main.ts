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

    const api = player.ruffle();
    await api.load({
      url: new URL("./game.swf", document.baseURI).href,
      autoplay: "off",
      unmuteOverlay: "hidden",
      backgroundColor: "#0f172a",
    });

    api.traceObserver = (message) => console.log(`[ActionScript 3] ${message}`);
    api.resume();

    statusElement.textContent = "Game loaded.";
  } catch (error: unknown) {
    console.error("Failed to start the game:", error);
    statusElement.textContent = "Unable to load the game. Check the browser console.";
  }
}

startGame();
