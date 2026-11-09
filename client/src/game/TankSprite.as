package
{
	import flash.display.Bitmap;
	import flash.display.Sprite;
	import flash.events.Event;
	import flash.geom.Rectangle;

	public class TankSprite extends Sprite
	{
		public var id:String;
		public var color:String;

		[Embed(source="../assets/tank_green.png")]
		private static const GreenTank:Class;

		[Embed(source="../assets/tank_red.png")]
		private static const RedTank:Class;

		private var tankSpeed:int = 3;
		private var fireHeld:Boolean = false;

		public function TankSprite(_id:String, _color:String)
		{
			id = _id;
			color = _color;
			var image:Bitmap = color == 'red' ? new RedTank() as Bitmap : new GreenTank();

			image.x = -image.width / 2;
			image.y = -image.height / 2;

			addChild(image);
		}

		public function toState():Object
		{
			return {
				id: id,
				color: color,
				x: x,
				y: y,
				rotation: rotation
			};
		}

		public function handleUpdate(event:Event, keys:Object, world:GameWorld):void
		{
			if (world.isStopped || checkProjectileCollision(world))
			{
				return;
			}

			var firePressed:Boolean = keys['Space'] === true;
			var shouldFire:Boolean = firePressed && !fireHeld;
			fireHeld = firePressed;

			var directionX:int = 0;
			var directionY:int = 0;

			if (keys['KeyW'])
			{
				directionY -= 1;
			}
			else if (keys['KeyS'])
			{
				directionY += 1;
			}
			else if (keys['KeyA'])
			{
				directionX -= 1;
			}
			else if (keys['KeyD'])
			{
				directionX += 1;
			}

			if (directionX != 0 || directionY != 0)
			{
				move(directionX, directionY, world);
			}

			if (checkProjectileCollision(world))
			{
				return;
			}
			if (shouldFire)
			{
				world.launchProjectile(this);
			}
		}

		private function checkProjectileCollision(world:GameWorld):Boolean
		{
			var tankBounds:Rectangle = getBounds(parent);

			for each (var projectile:ProjectileSprite in world.projectiles)
			{
				if (projectile.owner != this && tankBounds.intersects(projectile.getBounds(parent)))
				{
					world.stop();
					return true;
				}
			}

			return false;
		}

		private function move(directionX:int, directionY:int, world:GameWorld):void
		{
			var previousRotation:Number = rotation;
			rotation = (Math.atan2(directionY, directionX) * 180 / Math.PI + 90) + 180;

			var nextBounds:Rectangle = getBounds(parent);
			nextBounds.offset(directionX * tankSpeed, directionY * tankSpeed);

			if (!world.bounds.containsRect(nextBounds))
			{
				rotation = previousRotation;
				return;
			}

			for each (var wall:WallSprite in world.walls)
			{
				if (nextBounds.intersects(wall.getBounds(parent)))
				{
					rotation = previousRotation;
					return;
				}
			}

			x += directionX * tankSpeed;
			y += directionY * tankSpeed;
		}
	}
}
