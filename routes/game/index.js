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
            // we check if the player exists in our database.
            player = players.get(authKey);
            if (player && player.socket) {
                publish('error', {
                    type: 'connection',
                    message: "You're already connected to a game."
                })
            } else {
                subscribe('player.set.name', setName);
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
            // this basically removes the socket reference to the
            // player object.
            subscribe('disconnect', player.disconnect.bind(player));
            // will only accept if there's no current game.
            subscribe('game.find', findGame);
            // Update the client with the player data in the server.
            // id - the public ID of the user.
            // AuthKey - the private ID of the user used as an
            // identification
            publish('player.data', {
                id: player.id,
                authKey: player.authKey,
                expiresIn: player.expiresIn,
                expires: player.expires
            });
            // this basically just assigns the socket object to the
            // player instance.
            player.connect(socket);
        }
        /**
         * Registers the current player to the room.
         * @param game
         * @return {*}
         */
        function joinGame(game) {
            var gameID = game.id;
            // reason why we're using a collection method is that so
            // we can update the vacant games in the list.
            games.occupy(game, player);
            // this will tell the client what happened in the game.
            // which is useful for watching replays.
            game.backlogs(function(name, data){
                publish(name, data);
            });
            // when the client disconnects, we check if the game is empty,
            // then remove the game from the list.
            subscribe('disconnect', function() {
                if (game.connectedPlayers() === 0) {
                    games.remove(game);
                } else {
                    game.userDisconnect();
                }
            });
            // when the player's assets are loaded
            subscribe('ready', playerReady);
            // subscribe the user to the game list.
            socket.join(gameID);
            // Tell the client, he's subscribed to a game.
            publish('game.join', { id: gameID });
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
         * Creates a new game object.
         * @return {*}
         */
        function createGame() {
            var game = new Game();
            var gameID = game.id;
            game.on('log', function(event) {
                io.sockets.in(gameID).emit(event.name, event.data);
                console.log(
                    "|  Game (" + game.id + "): ",
                    event.name, '->',
                    JSON.stringify(event.data)
                );
            });
            games.add(game);
            return game;
        }
        /**
         * When the player has successfully loaded the assets in the game.
         */
        function playerReady() {
            if (game) {
                game.playerReady(player);
                // all the game events
                subscribe('unit.move', unitMove);
                subscribe('unit.attack', unitAttack);
                subscribe('unit.skip', unitSkip);
            }
        }

        function unitAttack(parameters) {
            var id = parameters.id;
            var targetId = parameters.targetId;
            var unit;
            var target;
            if (game.winner === null) {
                if ((unit = game.units.get(id)) && (target = game.units.get(targetId))) {
                    if (unit === game.activeUnit) {
                        game.attack(unit, target);
                    }
                }
            }
        }

        function unitSkip(unitId) {
            var activeUnit = game.activeUnit;
            if (game.winner === null) {
                if (activeUnit.playerId === player.id) {
                    if (activeUnit.id === unitId ){
                        game.skip(unitId);
                    }
                }
            }
        }

        function unitMove(data) {
            var tile;
            var unitId = data.id;
            var activeUnit = game.activeUnit;
            var unit;
            if (game.winner === null) {
                if (unit = game.units.get(data.id)) {
                    if (activeUnit === unit && activeUnit.playerId === player.id) {
                        if (tile = game.grid.get(data.x, data.y)) {
                            game.move(unit, tile);
                        }
                    }
                }
            }
        }

        function publish(topic, data) {
            socket.emit(topic, data);
        }

        function subscribe(topic, callback) {
            socket.on(topic, callback);
        }

        // Listen to only one event first which is the authentication
        // before proceeding to anything else.
        subscribe('auth', setAuthKey);
    }

    // basic configuration
    io.configure(function(){
        io.sockets.on('connection', connection);
        io.enable('browser client minification');
        io.enable('browser client etag');
        io.enable('browser client gzip');
        io.set('log level', 3);
        io.set('transports', [
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