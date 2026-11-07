// The self-hosted package installs this API on window via ruffle.js.
// https://ruffle.rs/js-docs/master/interfaces/Player.PlayerV1.html
interface RufflePlayerApi {
  traceObserver: ((message: string) => void) | null;
  load(options: {
    url: string;
    autoplay: "off";
    unmuteOverlay: "hidden";
    backgroundColor: string;
  }): Promise<void>;
  resume(): void;
}

interface RufflePlayerElement extends HTMLElement {
  ruffle(): RufflePlayerApi;
}

interface Window {
  RufflePlayer?: {
    newest(): {
      createPlayer(): RufflePlayerElement;
    };
  };
}
