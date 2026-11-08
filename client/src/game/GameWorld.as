package {
    import flash.geom.Rectangle;

    public class GameWorld {
        public const tanks: Vector.<TankSprite> = new Vector.<TankSprite>();
        public const walls: Vector.<WallSprite> = new Vector.<WallSprite>();
        public const projectiles: Vector.<ProjectileSprite> = new Vector.<ProjectileSprite>();
        public var bounds: Rectangle;
        private var stopped: Boolean = false;

        public function GameWorld(width:Number, height:Number) {
            bounds = new Rectangle(0, 0, width, height);
        }

        public function get isStopped(): Boolean {
            return stopped;
        }

        public function stop(): void {
            stopped = true;
        }

        public function launchProjectile(tank: TankSprite): ProjectileSprite {
            if (stopped || tank.parent === null) {
                return null;
            }

            // TODO: Compute angle in one func
            var angle: Number = (tank.rotation + 90) * Math.PI / 180;
            var projectile: ProjectileSprite = new ProjectileSprite(tank, Math.cos(angle), Math.sin(angle));
            var muzzleOffset: Number = Math.max(tank.width, tank.height) / 2 + projectile.getBounds(projectile).height / 2 + 1;

            projectile.x = tank.x + projectile.directionX * muzzleOffset;
            projectile.y = tank.y + projectile.directionY * muzzleOffset;
            tank.parent.addChild(projectile);
            projectiles.push(projectile);
            return projectile;
        }

        public function update(): void {
            if (stopped) {
                return;
            }

            for (var i: int = 0; i <= projectiles.length - 1; i++) {
                var projectile: ProjectileSprite = projectiles[i];
                projectile.update();
                var projectileBounds: Rectangle = projectile.getBounds(projectile.parent);
                var remove: Boolean = !bounds.containsRect(projectileBounds);

                for each (var wall: WallSprite in walls) {
                    if (projectileBounds.intersects(wall.getBounds(projectile.parent))) {
                        remove = true;
                        break;
                    }
                }

                if (remove) {
                    projectile.parent.removeChild(projectile);
                    projectiles.splice(i, 1);
                }
            }
        }
    }
}
