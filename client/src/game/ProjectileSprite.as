package
{
	import flash.display.Bitmap;
	import flash.display.Sprite;

	public class ProjectileSprite extends Sprite
	{
		public var id:String;
		public var parentId:String;

		[Embed(source="../assets/rocket.png")]
		private static const RocketImage:Class;

		private var _owner:TankSprite;
		private var _directionX:Number;
		private var _directionY:Number;
		public var speed:Number = 8;

		public function ProjectileSprite(projectileId:String, owner:TankSprite, directionX:Number, directionY:Number)
		{
			var length:Number = Math.sqrt(directionX * directionX + directionY * directionY);

			id = projectileId;
			_owner = owner;
			parentId = owner.id;
			_directionX = directionX / length;
			_directionY = directionY / length;

			var image:Bitmap = new RocketImage() as Bitmap;
			image.x = -image.width / 2;
			image.y = -image.height / 2;
			addChild(image);

			rotation = Math.atan2(this.directionY, this.directionX) * 180 / Math.PI + 90;
		}

		public function get owner():TankSprite
		{
			return _owner;
		}

		public function get directionX():Number
		{
			return _directionX;
		}

		public function get directionY():Number
		{
			return _directionY;
		}

		public function toState():Object
		{
			return {
				id: id,
				parent: parentId,
				x: x,
				y: y,
				rotation: rotation,
				direction: {x: directionX, y: directionY},
				speed: speed
			};
		}

		public function applyState(state:Object):void
		{
			x = state.x;
			y = state.y;
			rotation = state.rotation;
			_directionX = state.direction.x;
			_directionY = state.direction.y;
			speed = state.speed;
		}

		public function update():void
		{
			x += directionX * speed;
			y += directionY * speed;
		}
	}
}
