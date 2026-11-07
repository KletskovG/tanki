package {
    import flash.display.Sprite;
    import flash.text.TextField;
    import flash.text.TextFormat;

    [SWF(width="960", height="600", frameRate="60", backgroundColor="#0f172a")]
    public class Main extends Sprite {
        public function Main() {
            trace("Tanki game started.");

            var label:TextField = new TextField();
            label.defaultTextFormat = new TextFormat("_sans", 24, 0xe2e8f0);
            label.text = "ActionScript 3 is running.";
            label.width = 600;
            label.height = 50;
            label.x = 32;
            label.y = 32;
            label.selectable = false;
            addChild(label);
        }
    }
}
