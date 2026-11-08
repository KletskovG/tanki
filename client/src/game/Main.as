package {
    import flash.display.Sprite;
    import flash.events.Event;
    import flash.external.ExternalInterface;

    [SWF(width="960", height="800", frameRate="60", backgroundColor="#0f172a")]
    public class Main extends Sprite {
        private var tankGreen: TankSprite;
        private var tankRed: TankSprite;
        private var keys: Object = {};
        private var world:GameWorld;

        public function Main() {
            world = new GameWorld(960, 800);
            addChild(new Walls(world));

            tankGreen = new TankSprite("green");
            tankRed = new TankSprite("red");
            
            tankGreen.x = 480;
            tankGreen.y = 100;
            tankRed.x = 480;
            tankRed.y = 700;

            addChild(tankGreen);
            addChild(tankRed);
            world.tanks.push(tankGreen, tankRed);

            addEventListener(Event.ENTER_FRAME, update);

            if (ExternalInterface.available) {
                ExternalInterface.addCallback("setKeyState", setKeyState);
                ExternalInterface.call("onTankiReady");
            }
        }

        private function setKeyState(code: String, pressed: Boolean): void {
            if (world.isStopped) {
                return;
            }
            
            keys[code] = pressed;
        }

        private function update(event: Event): void {
            world.update();
            
            for each (var tank: TankSprite in world.tanks) {
                tank.handleUpdate(event, tank == tankGreen ? keys : {}, world);
                if (world.isStopped) {
                    removeEventListener(Event.ENTER_FRAME, update);
                    keys = {};
                    trace("Game over: a tank was hit.");
                    if (ExternalInterface.available) ExternalInterface.call("onTankiGameOver");
                    break;
                }
            }
        }
    }
}
