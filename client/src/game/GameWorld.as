package
{
	import flash.geom.Rectangle;

	public class GameWorld
	{
		public const tanks:Vector.<TankSprite> = new Vector.<TankSprite>();
		public const walls:Vector.<WallSprite> = new Vector.<WallSprite>();
		public const projectiles:Vector.<ProjectileSprite> = new Vector.<ProjectileSprite>();
		public var bounds:Rectangle;
		private var stopped:Boolean = false;
		private var playerTank:TankSprite;
		private var projectileSequence:uint = 0;
		private var projectilesById:Object = {};

		public function GameWorld(width:Number, height:Number, color:String, greenTankId:String, redTankId:String)
		{
			bounds = new Rectangle(0, 0, width, height);

			var tankGreen:TankSprite = new TankSprite(greenTankId, 'green');
			var tankRed:TankSprite = new TankSprite(redTankId, 'red');

			tankGreen.x = 480;
			tankGreen.y = 100;
			tankRed.x = 480;
			tankRed.y = 700;

			tanks.push(tankGreen, tankRed);
			playerTank = color == 'red' ? tankRed : tankGreen;
		}

		public function get controlledTank():TankSprite
		{
			return playerTank;
		}

		public function get isStopped():Boolean
		{
			return stopped;
		}

		public function stop():void
		{
			stopped = true;
		}

		private function findTank(id:String):TankSprite
		{
			for each (var tank:TankSprite in tanks)
			{
				if (tank.id == id)
				{
					return tank;
				}
			}
			return null;
		}

		private function removeProjectile(index:int):void
		{
			var projectile:ProjectileSprite = projectiles[index];
			if (projectile.parent != null)
			{
				projectile.parent.removeChild(projectile);
			}
			delete projectilesById[projectile.id];
			projectiles.splice(index, 1);
		}

		public function applyState(state:Object):void
		{
			if (stopped)
			{
				return;
			}

			for each (var tankState:Object in state.tanks)
			{
				var tank:TankSprite = findTank(tankState.id);
				if (tank != null && tank != playerTank)
				{
					tank.x = tankState.x;
					tank.y = tankState.y;
					tank.rotation = tankState.rotation;
				}
			}

			var remoteIds:Object = {};
			for each (var projectileState:Object in state.projectiles)
			{
				if (projectileState.parent == playerTank.id)
				{
					continue;
				}
				var owner:TankSprite = findTank(projectileState.parent);
				if (owner == null)
				{
					continue;
				}

				var projectile:ProjectileSprite = projectilesById[projectileState.id] as ProjectileSprite;
				if (projectile == null)
				{
					projectile = new ProjectileSprite(projectileState.id, owner, projectileState.direction.x, projectileState.direction.y);
					playerTank.parent.addChild(projectile);
					projectiles.push(projectile);
					projectilesById[projectile.id] = projectile;
				}
				projectile.applyState(projectileState);
				remoteIds[projectile.id] = true;
			}

			for (var i:int = projectiles.length - 1; i >= 0; i--)
			{
				projectile = projectiles[i];
				if (projectile.parentId != playerTank.id && !remoteIds[projectile.id])
				{
					removeProjectile(i);
				}
			}

			if (state.stopped)
			{
				stop();
			}
		}

		public function toState():Object
		{
			var tankStates:Array = [];
			var wallStates:Array = [];
			var projectileStates:Array = [];

			for each (var tank:TankSprite in tanks)
			{
				tankStates.push(tank.toState());
			}
			for each (var wall:WallSprite in walls)
			{
				wallStates.push(wall.toState());
			}
			for each (var projectile:ProjectileSprite in projectiles)
			{
				projectileStates.push(projectile.toState());
			}

			return {
				bounds: {
					x: bounds.x,
					y: bounds.y,
					width: bounds.width,
					height: bounds.height
				},
				tanks: tankStates,
				walls: wallStates,
				projectiles: projectileStates,
				stopped: stopped
			};
		}

		public function launchProjectile(tank:TankSprite):ProjectileSprite
		{
			if (stopped || tank.parent === null)
			{
				return null;
			}

			// TODO: Compute angle in one func
			var angle:Number = (tank.rotation + 90) * Math.PI / 180;
			projectileSequence += 1;
			var projectileId:String = tank.id + '-' + new Date().time.toString(16) + '-' + projectileSequence;
			var projectile:ProjectileSprite = new ProjectileSprite(projectileId, tank, Math.cos(angle), Math.sin(angle));
			var muzzleOffset:Number = Math.max(tank.width, tank.height) / 2 + projectile.getBounds(projectile).height / 2 + 1;

			projectile.x = tank.x + projectile.directionX * muzzleOffset;
			projectile.y = tank.y + projectile.directionY * muzzleOffset;
			tank.parent.addChild(projectile);
			projectiles.push(projectile);
			projectilesById[projectile.id] = projectile;
			return projectile;
		}

		public function update():void
		{
			if (stopped)
			{
				return;
			}

			for (var i:int = projectiles.length - 1; i >= 0; i--)
			{
				var projectile:ProjectileSprite = projectiles[i];
				if (projectile.parentId != playerTank.id)
				{
					continue;
				}
				projectile.update();
				var projectileBounds:Rectangle = projectile.getBounds(projectile.parent);
				var remove:Boolean = !bounds.containsRect(projectileBounds);

				for each (var wall:WallSprite in walls)
				{
					if (projectileBounds.intersects(wall.getBounds(projectile.parent)))
					{
						remove = true;
						break;
					}
				}

				if (remove)
				{
					removeProjectile(i);
				}
			}
		}
	}
}
