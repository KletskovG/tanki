package {
    import flash.display.Sprite;

    [SWF(width="960", height="1200", frameRate="60", backgroundColor="#0f172a")]
    public class Main extends Sprite {
        public function Main() {
            trace("Tanki game started. Test");

            var tankGreen: TankSprite = new TankSprite("green");
            tankGreen.x = 480;
            tankGreen.y = 200;

            addChild(tankGreen);

            var tankRed: TankSprite = new TankSprite("red");
            tankRed.x = 480;
            tankRed.y = 1000;

            trace(tankRed)

            addChild(tankRed)
        }
    }
}
