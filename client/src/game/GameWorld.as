package {
    import flash.geom.Rectangle;

    public class GameWorld {
        public const tanks: Vector.<TankSprite> = new Vector.<TankSprite>();
        public const walls: Vector.<WallSprite> = new Vector.<WallSprite>();
        public const projectiles: Vector.<ProjectileSprite> = new Vector.<ProjectileSprite>();
        public var bounds: Rectangle;
        private var stopped: Boolean = false;
        private var playerTank: TankSprite;

        public function GameWorld(width: Number, height: Number, color: String, greenTankId: String, redTankId: String) {
            bounds = new Rectangle(0, 0, width, height);

            var tankGreen: TankSprite = new TankSprite(greenTankId, "green");
            var tankRed: TankSprite = new TankSprite(redTankId, "red");

            tankGreen.x = 480;
            tankGreen.y = 100;
            tankRed.x = 480;
            tankRed.y = 700;

            tanks.push(tankGreen, tankRed);
            playerTank = color == "red" ? tankRed : tankGreen;
        }

        public function get controlledTank(): TankSprite {
            return playerTank;
        }

        public function get isStopped(): Boolean {
            return stopped;
        }

        public function stop(): void {
            stopped = true;
        }

        public function toState(): Object {
            var tankStates: Array = [];
            var wallStates: Array = [];
            var projectileStates: Array = [];

            for each (var tank: TankSprite in tanks) {
                tankStates.push(tank.toState());
            }
            for each (var wall: WallSprite in walls) {
                wallStates.push(wall.toState());
            }
            for each (var projectile: ProjectileSprite in projectiles) {
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
