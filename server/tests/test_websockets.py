import asyncio
import json
import unittest

import routes
from game import Game
from game.connections import GameConnections
from main import app


class Client:
    """An in-process ASGI socket; exercises the real FastAPI route."""

    def __init__(self, game_id):
        self.incoming = asyncio.Queue()
        self.outgoing = asyncio.Queue()
        self.scope = {
            'type': 'websocket', 'asgi': {'version': '3.0'},
            'scheme': 'ws', 'path': f'/game/{game_id}',
            'raw_path': f'/game/{game_id}'.encode(), 'root_path': '',
            'query_string': b'', 'headers': [], 'subprotocols': [],
            'server': ('localhost', 8000), 'client': ('localhost', 12345),
        }
        self.task = None

    async def open(self):
        await self.incoming.put({'type': 'websocket.connect'})
        self.task = asyncio.create_task(app(self.scope, self.incoming.get, self.send))
        message = await self.receive()
        assert message['type'] == 'websocket.accept', message
        return self

    async def send(self, message):
        # Model a transport that yields while sending; exercise concurrent joins/leaves.
        await asyncio.sleep(0)
        await self.outgoing.put(message)

    async def receive(self):
        return await asyncio.wait_for(self.outgoing.get(), 1)

    async def presence(self):
        message = await self.receive()
        assert message['type'] == 'websocket.send', message
        return json.loads(message['text'])

    async def disconnect(self):
        if self.task is None:
            return
        if not self.task.done():
            await self.incoming.put({'type': 'websocket.disconnect', 'code': 1000})
        await asyncio.wait_for(self.task, 1)


class StartupTests(unittest.TestCase):
    def test_connections_created_before_server_loop(self):
        dormant_loop = asyncio.new_event_loop()
        asyncio.set_event_loop(dormant_loop)
        routes.connections = GameConnections()
        Game.clear()
        game_id = Game.new_game()

        async def connect_and_leave():
            clients = [Client(game_id), Client(game_id)]
            try:
                await asyncio.gather(*(client.open() for client in clients))
                self.assertEqual((await clients[0].presence())['players'], 1)
                for client in clients:
                    self.assertEqual((await client.presence())['players'], 2)
            finally:
                await asyncio.gather(*(client.disconnect() for client in clients))
            self.assertEqual(routes.connections.rooms, {})

        try:
            asyncio.run(connect_and_leave())
        finally:
            dormant_loop.close()
            asyncio.set_event_loop(None)
            Game.clear()


class WebSocketTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        Game.clear()
        routes.connections = GameConnections()
        self.game_id = Game.new_game()
        self.clients = []

    async def connect(self, game_id=None):
        client = Client(game_id or self.game_id)
        self.clients.append(client)
        return await client.open()

    async def asyncTearDown(self):
        for client in self.clients:
            await client.disconnect()
        self.assertEqual(routes.connections.rooms, {})
        Game.clear()

    async def test_two_players_and_disconnect(self):
        first = await self.connect()
        self.assertEqual(await first.presence(), {'type': 'presence', 'players': 1})
        second = await self.connect()
        for client in (first, second):
            self.assertEqual(await client.presence(), {'type': 'presence', 'players': 2})
        await second.disconnect()
        self.assertEqual(await first.presence(), {'type': 'presence', 'players': 1})

    async def test_full_and_missing_games_are_rejected(self):
        first = await self.connect()
        await first.presence()
        second = await self.connect()
        await first.presence()
        await second.presence()
        third = await self.connect()
        message = await third.receive()
        self.assertEqual(message['code'], 1008)
        self.assertIn('two players', message['reason'])
        missing = await self.connect('missing-game')
        message = await missing.receive()
        self.assertEqual(message['code'], 1008)
        self.assertEqual(message['reason'], 'Game not found.')
        self.assertEqual(len(routes.connections.rooms[self.game_id]), 2)

    async def test_games_have_independent_connections(self):
        first = await self.connect()
        self.assertEqual((await first.presence())['players'], 1)
        other_id = Game.new_game()
        other = await self.connect(other_id)
        self.assertEqual((await other.presence())['players'], 1)
        second = await self.connect()
        self.assertEqual((await first.presence())['players'], 2)
        self.assertEqual((await second.presence())['players'], 2)
        self.assertTrue(other.outgoing.empty())

    async def test_clear_closes_open_connections(self):
        client = await self.connect()
        await client.presence()
        response = await routes.clear()
        self.assertEqual(response.status_code, 200)
        message = await client.receive()
        self.assertEqual(message['type'], 'websocket.close')
        self.assertEqual(message['code'], 1001)
        self.assertEqual(message['reason'], 'Games cleared.')
        self.assertEqual(Game.game_storage, {})
        self.assertEqual(routes.connections.rooms, {})

    async def test_gameplay_messages_are_not_synchronized(self):
        first = await self.connect()
        await first.presence()
        second = await self.connect()
        await first.presence()
        await second.presence()
        await first.incoming.put({'type': 'websocket.receive', 'text': '{"move":"left"}'})
        await asyncio.sleep(0)
        await asyncio.sleep(0)
        self.assertTrue(first.outgoing.empty())
        self.assertTrue(second.outgoing.empty())


if __name__ == '__main__':
    unittest.main()
