var Users = require('./players');
var Player = require('./player');
var Games = require('./games');
var Game = require('./game');
var utils = require('./utils');

module.exports = function(io) {
    "use strict";

    var users = new Users();
    var games = new Games();

    /**
     * Event handler when someone connects.
     * @param socket
     */
    function connection(socket) {
        var player;
        var game;

        /**
         * checks the client's authKey cookie
         * @param data
         */
        function setAuthKey(data) {
            var authKey = data.wol_id;
            player = users.get(authKey);
            if (player === undefined) {
                player = new Player();
                users.add(player);
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
            return game;
        }

        /**
         * Creates a new game object.
         * @return {*}
         */
        function createGame() {
            var game = new Game();
            game.on('log', function(event) {
                io.sockets.in(game.id).emit(event.name, event.data);
                console.log("Game (" + game.id + "): ", event.name, JSON.stringify(event.data));
            });
            games.add(game);
            return game;
        }

        /**
         * Fins a game to join. If none exists, it'll create one.
         */
        function findGame() {
            var gameID;
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
         * All the events needed for starting a game.
         */
        function assignEvents() {
            socket.on('game.find', findGame);
            socket.on('player.setName', setName);
            socket.emit('player.setData', {
                id: player.id,
                authKey: player.authKey
            });
        }

        socket.on('player.setAuthKey', setAuthKey);
    }

    io.of('/game').on('connection', connection);
    io.set('log level', 1);
};