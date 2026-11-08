// The self-hosted package installs this API on window via ruffle.js.
// https://ruffle.rs/js-docs/master/interfaces/Player.PlayerV1.html
interface RufflePlayerApi {
  readonly metadata: { width: number; height: number } | null;
  traceObserver: ((message: string) => void) | null;
  load(options: {
    data: ArrayBuffer;
    swfFileName: string;
    autoplay: "off";
    unmuteOverlay: "hidden";
    backgroundColor: string;
    allowScriptAccess: boolean;
  }): Promise<void>;
  resume(): void;
  suspend(): void;
  callExternalInterface(name: string, ...args: unknown[]): unknown;
}

interface RufflePlayerElement extends HTMLElement {
  ruffle(): RufflePlayerApi;
}

interface Window {
  RufflePlayer?: {
    newest(): {
      createPlayer(): RufflePlayerElement;
    } | null;
  };
  onTankiReady: VoidFunction;
  onTankiGameOver: VoidFunction;
}
