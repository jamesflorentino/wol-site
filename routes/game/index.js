var Players = require('./players');
var Player = require('./player');
var Games = require('./games');
var Game = require('./game');
var utils = require('./utils');

var GameApp = function(io) {
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
            var authKey = data.authKey;
            player = players.get(authKey);
            socket.on('player.set.name', setName);
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
            game.backlogs(function(event){
                socket.emit(event.name, event.data);
            });
            return game;
        }
        /**
         * Creates a new game object.
         * @return {*}
         */
        function createGame() {
            var game = new Game();
            var gameID = game.id;
            game.on('log', function(event) {
                io.sockets.in(gameID).emit(event.name, event.data);
                console.log(" — Game (" + game.id + "): ", event.name, '->', JSON.stringify(event.data));
            });
            games.add(game);
            return game;
        }
        /**
         * Fins a game to join. If none exists, it'll create one.
         */
        function findGame() {
            if (game === undefined) {
                game = joinGame(games.available() || createGame());
            }
        }
        /**
         * Sets the name of the player from the client.
         * @param data
         */
        function setName(data) {
            if (!player) {
                player = new Player();
                players.add(player);
            }
            player.name = data.name;
            assignEvents();
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
            socket.emit('player.data', {
                id: player.id,
                authKey: player.authKey,
                expiresIn: player.expiresIn,
                expires: player.expires
            });
            player.connect(socket);
        }
        socket.on('auth', setAuthKey);
    }
    // basic configuration
    io.configure(function(){
        io.sockets.on('connection', connection);
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
    })

};

/**
 * Route for the main version
 * @param req
 * @param res
 */
GameApp.route = function(req, res) {
    res.render('game', { title: 'Game - Wings Of Lemuria' });
};

/**
 * Route for the dev version
 * @param req
 * @param res
 */
GameApp.routeDev = function(req, res) {
    res.render('game-test', { title: 'Game - Wings Of Lemuria' });
};

module.exports = GameApp;