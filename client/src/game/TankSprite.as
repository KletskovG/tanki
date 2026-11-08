package {
    import flash.display.Bitmap;
    import flash.display.Sprite;

    public class TankSprite extends Sprite {
        [Embed(source="../assets/tank_green.png")]
        private static const GreenTank:Class;

        [Embed(source="../assets/tank_red.png")]
        private static const RedTank:Class;

        public function TankSprite(color: String) {
            var image: Bitmap = color == "red" ? new RedTank() as Bitmap : new GreenTank();

            image.x = -image.width / 2;
            image.y = -image.height / 2;

            addChild(image);
        }
    }
}