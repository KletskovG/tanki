package {
    import flash.display.Bitmap;
    import flash.display.Sprite;

    public class ProjectileSprite extends Sprite {
        [Embed(source="../assets/rocket.png")]
        private static const RocketImage: Class;

        private var _owner: TankSprite;
        private var _directionX: int;
        private var _directionY: int;
        public const speed: int = 8;

        public function ProjectileSprite(owner: TankSprite, directionX: int, directionY: int) {
            var length: int = Math.sqrt(directionX * directionX + directionY * directionY);

            _owner = owner;
            _directionX = directionX / length;
            _directionY = directionY / length;

            var image: Bitmap = new RocketImage() as Bitmap;
            image.x = -image.width / 2;
            image.y = -image.height / 2;
            addChild(image);

            rotation = Math.atan2(this.directionY, this.directionX) * 180 / Math.PI + 90;
        }

        public function get owner():TankSprite {
            return _owner;
        }

        public function get directionX(): int {
            return _directionX;
        }

        public function get directionY(): int {
            return _directionY;
        }

        public function update(): void {
            x += directionX * speed;
            y += directionY * speed;
        }
    }
}
