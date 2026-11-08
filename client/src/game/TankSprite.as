package {
    import flash.display.Bitmap;
    import flash.display.Sprite;
    import flash.events.Event;
    import flash.geom.Rectangle;

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

        public function handleUpdate(event: Event, keys: Object, world: GameWorld): void {
            var dx: int = 0;
            var dy: int = 0;

            if (keys["KeyW"]) {
                dy -= 1;
            } else if (keys["KeyS"]) {
                dy += 1;
            } else if (keys["KeyA"]) {
                dx -= 1;
            } else if (keys["KeyD"]) {
                dx += 1;
            }

            if (dx == 0 && dy == 0) {
                return;
            }

            var previousRotation:Number = rotation;
            rotation = (Math.atan2(dy, dx) * 180 / Math.PI + 90) + 180;

            var nextBounds:Rectangle = getBounds(parent);
            nextBounds.offset(dx * tankSpeed, dy * tankSpeed);

            if (!world.bounds.containsRect(nextBounds)) {
                rotation = previousRotation;
                return;
            }

            for each (var wall: WallSprite in world.walls) {
                if (nextBounds.intersects(wall.getBounds(parent))) {
                    rotation = previousRotation;
                    return;
                }
            }

            x += dx * tankSpeed;
            y += dy * tankSpeed;
        }
    }
}
