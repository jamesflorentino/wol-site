var Players = require('./players');
var Player = require('./player');
var Games = require('./games');
var Game = require('./game');
var utils = require('./utils');

module.exports = function(io) {
    "use strict";

    var players = new Players();
    var games = new Games();

    /**
     * Event handler when someone connects.
     * @param socket
     */
    function connection(socket) {
        var player;
        var game; // current game. Allow only one game per session for now.

        /**
         * checks the client's authKey cookie
         * @param data
         */
        function setAuthKey(data) {
            var authKey = data.wol_id;
            player = players.get(authKey);
            if (player === undefined) {
                player = new Player();
                players.add(player);
            }
            assignEvents();
        }

        /**
         * Registers the current player to the room.
         * @param game
         * @return {*}
         */
        function joinGame(game) {
            var gameID = game.id;
            games.occupy(game, player);
            socket.join(gameID);
            socket.emit('game.join', { id: gameID });
            socket.on('disconnect', function() {
                player.connected = false;
                if (game.connectedPlayers() === 0) {
                    games.remove(game);
                }
            });
            game.start();
            return game;
        }

        /**
         * Creates a new game object.
         * @return {*}
         */
        function createGame() {
            var game = new Game();
            game.on('log', function(event) {
                io.sockets.in(game.id).emit(event.name, true);
                //console.log("Game (" + game.id + "): ", event.name, '->', JSON.stringify(event.data));
            });
            games.add(game);
            io.sockets.in(game.id).emit('unit.add', { foo:'bar' });
            return game;
        }
        /**
         * Fins a game to join. If none exists, it'll create one.
         */
        function findGame() {
            if (game === undefined) {
                var ava = games.available();
                game = joinGame(ava || createGame());
            }
        }

        /**
         * Sets the name of the player from the client.
         * @param data
         */
        function setName(data) {
            player.name = data.name;
        }

        /**
         * Tell the player to disconnect.
         */
        function disconnect() {
            player.disconnect();
        }

        /**
         * All the events needed for starting a game.
         */
        function assignEvents() {
            socket.on('disconnect', disconnect);
            socket.on('game.find', findGame);
            socket.on('player.setName', setName);
            socket.emit('player.setData', {
                id: player.id,
                authKey: player.authKey,
                expiresIn: player.expiresIn,
                expires: player.expires
            });
            player.connect(socket);
        }

        socket.on('player.setAuthKey', setAuthKey);
    }

    io.of('/game').on('connection', connection);
    io.enable('browser client minification');  // send minified client
    io.enable('browser client etag');          // apply etag caching logic based on version number
    io.enable('browser client gzip');          // gzip the file
    io.set('log level', 3);                    // reduce logging
    io.set('transports', [                     // enable all transports (optional if you want flashsocket)
        'websocket'
        , 'flashsocket'
        , 'htmlfile'
        , 'xhr-polling'
        , 'jsonp-polling'
    ]);

};