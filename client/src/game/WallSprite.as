package {
    import flash.display.Sprite;
    import flash.geom.Rectangle;

    public class WallSprite extends Sprite {
        public function WallSprite(bounds:Rectangle) {
            x = bounds.x;
            y = bounds.y;
            graphics.beginFill(0x64748b);
            graphics.drawRect(0, 0, bounds.width, bounds.height);
            graphics.endFill();
        }

        public function toState(): Object {
            return {
                x: x,
                y: y,
                width: width,
                height: height
            };
        }
    }
}
