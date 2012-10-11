var Players = require('./players');
var Player = require('./player');
var Games = require('./games');
var Game = require('./game');
var utils = require('./utils');

var GameApp = function(io) {

    "use strict";

    var players = new Players();
    var games = new Games();

    this.api = {
        players: function(req, res) {
            res.json(players.toJSON());
        },
        games: function(req, res) {
            res.json(games.toJSON());
        }
    };

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
            // does the player exist in memory?
            player = players.get(authKey);
            if (player) {
                // is he currently in a session?
                if (player.socket) {
                    publish('auth.response', {
                        type: 'error',
                        error: "You're already connected to a game."
                    });
                } else {
                    playerSetData();
                }
            } else {
                publish('auth.response', {
                    type: 'new_user'
                });
            }
            subscribe('player.set.name', setName);
        }

        function playerSetData() {
            player.connect(socket);
            subscribe('game.find', findGame);
            publish('auth.response', {
                type: 'connected',
                id: player.id,
                name: player.name,
                authKey: player.authKey,
                expiresIn: player.expiresIn,
                expires: player.expires
            });
        }
        /**
         * Sets the name of the player from the client.
         * @param data
         */
        function setName(data) {
            if (!player) {
                player = new Player();
                player.name = data.name;
                players.add(player);
                playerSetData();
            } else {
                player.name = data.name;
            }
            publish('player.set.name', { name: player.name });
        }
        /**
         * Registers the current player to the room.
         * @param game
         * @return {*}
         */
        function joinGame(game, team) {
            var gameID = game.id;
            // reason why we're using a collection method is that so
            // we can update the vacant games in the list.
            games.occupy(game, player, team);
            // this will tell the client what happened in the game.
            // which is useful for watching replays.
            game.backlogs(function(name, data){
                publish(name, data);
            });
            // when the client disconnects, we check if the game is empty,
            // then remove the game from the list.
            subscribe('disconnect', function() {
                player.disconnect();
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
        function findGame(parameters) {
            var team = parameters.team;
            var mode = parameters.mode;
            if (game === undefined) {
                switch (mode) {
                    case 'tutorial':
                        game = joinGame(createGame(1), team);
                        break;
                    default:
                        game = joinGame(games.available() || createGame(), team);
                        break;
                }
            }
        }
        /**
         * Creates a new game object.
         * @return {*}
         */
        function createGame(maxPlayers) {
            maxPlayers || (maxPlayers = 2);
            var game = new Game({ maxPlayers: maxPlayers });
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
            var tile;
            // check if there's a current game.
            if (game && game.winner === null) {
                // check if the current active unit is from the players.
                if (game.activeUnit && game.activeUnit.playerId === player.id) {
                    tile = game.grid.get(parameters.x, parameters.y);
                    if (tile) {
                        game.actUnit(game.activeUnit, tile);
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
            var activeUnit = game.activeUnit;
            // if the game isn't finished yet
            if (game.winner === null) {
                if (activeUnit && activeUnit.playerId === player.id) {
                    if (tile = game.grid.get(data.x, data.y)) {
                        game.move(activeUnit, tile);
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

    io.sockets.on('connection', connection);
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
