// The self-hosted package installs this API on window via ruffle.js.
// https://ruffle.rs/js-docs/master/interfaces/Player.PlayerV1.html
interface RufflePlayerApi {
  readonly metadata: { width: number; height: number } | null;
  traceObserver: ((message: string) => void) | null;
  load(options: {
    url: string;
    autoplay: "off";
    unmuteOverlay: "hidden";
    backgroundColor: string;
    allowScriptAccess: boolean;
  }): Promise<void>;
  resume(): void;
  callExternalInterface(eventName: string, eventCode: string, pressed: boolean): void;
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
