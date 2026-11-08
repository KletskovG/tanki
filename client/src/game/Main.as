package {
    import flash.display.Sprite;
    import flash.events.Event;
    import flash.external.ExternalInterface;

    [SWF(width="960", height="1200", frameRate="60", backgroundColor="#0f172a")]
    public class Main extends Sprite {
        private var tankGreen: TankSprite;
        private var tankRed: TankSprite;
        private var keys: Object = {};

        public function Main() {
            tankGreen = new TankSprite("green");
            tankRed = new TankSprite("red");
            
            tankGreen.x = 480;
            tankGreen.y = 200;
            tankRed.x = 480;
            tankRed.y = 1000;

            addChild(tankGreen);
            addChild(tankRed);

            addEventListener(Event.ENTER_FRAME, update);

            if (ExternalInterface.available) {
                ExternalInterface.addCallback("setKeyState", setKeyState);
                ExternalInterface.call("onTankiReady");
            }
        }

        private function setKeyState(code: String, pressed: Boolean): void {
            keys[code] = pressed;
        }

        private function update(event: Event): void {
            tankGreen.handleUpdate(event, keys, tankGreen);
        }
    }
}
