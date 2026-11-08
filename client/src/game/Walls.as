package {
    import flash.display.Sprite;
    import flash.geom.Rectangle;

    public class Walls extends Sprite {
        private static const CONFIG:Vector.<Rectangle> = new <Rectangle>[
            new Rectangle(160, 360, 240, 32),
            new Rectangle(560, 360, 240, 32),
            new Rectangle(464, 480, 32, 240),
            new Rectangle(160, 808, 240, 32),
            new Rectangle(560, 808, 240, 32)
        ];

        public function Walls(world:GameWorld) {
            for each (var bounds:Rectangle in CONFIG) {
                var wall:WallSprite = new WallSprite(bounds);
                world.walls.push(wall);
                addChild(wall);
            }
        }
    }
}
