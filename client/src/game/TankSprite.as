package {
    import flash.display.Bitmap;
    import flash.display.Sprite;
    import flash.events.Event;

    public class TankSprite extends Sprite {
        [Embed(source="../assets/tank_green.png")]
        private static const GreenTank: Class;

        [Embed(source="../assets/tank_red.png")]
        private static const RedTank: Class;

        private var tankSpeed: int = 3;

        public function TankSprite(color: String) {
            var image: Bitmap = color == "red" ? new RedTank() as Bitmap : new GreenTank();

            image.x = -image.width / 2;
            image.y = -image.height / 2;

            addChild(image);
        }

        public function handleUpdate(event: Event, keys: Object, tank: TankSprite) {
            if (keys["KeyW"]) {
                if (tank.y - tankSpeed < 0) {
                    return;
                }

                tank.y -= tankSpeed;
            } else if (keys["KeyS"]) {
                if (tank.y + tankSpeed > 1200) {
                    return;
                }
                tank.y += tankSpeed;
            } else if (keys["KeyA"]) {
                tank.x -= tankSpeed;
            } else if (keys["KeyD"]) {
                tank.x += tankSpeed;
            }
        }
    }
}