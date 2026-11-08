package {
    import flash.display.Sprite;
    import flash.geom.Rectangle;

    public class GameWorld {
        public const tanks: Vector.<TankSprite> = new Vector.<TankSprite>();
        public const walls: Vector.<WallSprite> = new Vector.<WallSprite>();
        public const projectiles: Vector.<Sprite> = new Vector.<Sprite>();
        public var bounds: Rectangle;

        public function GameWorld(width:Number, height:Number) {
            bounds = new Rectangle(0, 0, width, height);
        }
    }
}
