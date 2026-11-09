package
{
	import flash.display.Sprite;
	import flash.events.Event;
	import flash.external.ExternalInterface;

	[SWF(width="960", height="800", frameRate="60", backgroundColor="#0f172a")]
	public class Main extends Sprite
	{
		private var keys:Object = {};
		private var world:GameWorld;
		private var finished:Boolean = false;

		public function Main()
		{
			if (ExternalInterface.available)
			{
				ExternalInterface.addCallback('setKeyState', setKeyState);
				ExternalInterface.addCallback('startGame', startGame);
				ExternalInterface.addCallback('applyState', applyState);
				ExternalInterface.call('onTankiReady');
			}
		}

		private function startGame(color:String, greenTankId:String, redTankId:String):void
		{
			if (world != null)
			{
				return;
			}

			world = new GameWorld(960, 800, color, greenTankId, redTankId);
			addChild(new Walls(world));

			addChild(world.tanks[0]);
			addChild(world.tanks[1]);

			addEventListener(Event.ENTER_FRAME, update);
		}

		private function setKeyState(code:String, pressed:Boolean):void
		{
			if (world == null || world.isStopped)
			{
				return;
			}

			keys[code] = pressed;
		}

		private function applyState(state:Object):void
		{
			if (world == null || finished)
			{
				return;
			}
			world.applyState(state);
			if (world.isStopped)
			{
				finishGame(false);
			}
		}

		private function finishGame(notifyServer:Boolean):void
		{
			if (finished)
			{
				return;
			}
			finished = true;
			removeEventListener(Event.ENTER_FRAME, update);
			keys = {};
			trace('Game over: a tank was hit.');

			if (ExternalInterface.available)
			{
				if (notifyServer)
				{
					ExternalInterface.call('onTankiSync', world.toState());
				}
				ExternalInterface.call('onTankiGameOver');
			}
		}

		private function update(event:Event):void
		{
			if (finished)
			{
				return;
			}
			world.update();

			for each (var tank:TankSprite in world.tanks)
			{
				tank.handleUpdate(event, tank == world.controlledTank ? keys : {}, world);
				if (world.isStopped)
				{
					break;
				}
			}

			if (world.isStopped)
			{
				finishGame(true);
				return;
			}

			if (ExternalInterface.available)
			{
				ExternalInterface.call('onTankiSync', world.toState());
			}
		}
	}
}
