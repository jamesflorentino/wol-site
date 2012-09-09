define([
    'wol/wol',
    'wol/collection',
    'game/base',
    'cookies',
    'game/entities/marine'

], function(
    wol,
    Collection,
    Base,
    Cookies,
    Marine
) {

    "use strict";

    var vendorName = navigator.vendor.replace(/(^\w+).+/, function (a, b) {
        return b;
    });

    return Base.extend({
        sio: null,
        /**
         * A collection of users in the game.
         */
        players: new wol.Collection(),
        /**
         * A collection of units that can be easily removed, added or referenced.
         */
        units: new wol.Collection(),
        /**
         * The current player's data.
         */
        player: {
            name: null,
            id: null
        },
        /**
         * A static list of unit classes for easy reference when spawning units
         * from the server.
         */
        unitClasses: {
            'marine': Marine
        },
        init: function() {
            this.parent();
            this.setEvents();
        },
        addPlayer: function(data) {
            var id = data.id,
                name = data.name
            ;
            this.players.add({
                id: id,
                name: data.name
            });
            console.log('player', this.players.get(id));
        },
        /**
         * Client Event: Find an available/vacant game.
         */
        findGame: function() {
            this.sio.emit('game.find');
        },
        /**
         * Server Event: Tells the client that the user joined a room.
         */
        gameJoin: function() {
            // todo - manage game rooms.
        },
        /**
         * Client Event: Sends a cookie to the server to let it know if the user exists in the db.
         * @return {*}
         */
        setAuthKey: function() {
            this.sio.emit('player.setAuthKey', {
                wol_id: Cookies.get('wol_id')
            });
            return this;
        },
        /**
         * Connects to the socket server.
         * @return {*}
         */
        setEvents: function() {
            this.sio = io.connect('//localhost:3000');
            this.sio
                // player events
                .on('player.setData', this.setPlayerData.bind(this))
                .on('player.add', this.addPlayer.bind(this))
                // game events
                .on('game.join', this.gameJoin.bind(this))
                // unit events
                .on('unit.add', this.unitAdd.bind(this))
                .on('unit.spawn', this.unitSpawn.bind(this))
                .on('unit.move', this.unitMove.bind(this))
            ;
            this.setAuthKey();
            return this;
        },
        /**
         * Server Event: The player receives authentication from the server and is given a
         * public ID and private key.
         * @param data
         */
        setPlayerData: function(data) {
            var id = data.id;
            var authKey = data.authKey;
            if (id && authKey) {
                Cookies.set('wol_id', authKey, {
                    expires: data.expiresIn
                });
            }
            this.setName();
            this.findGame();
        },
        /**
         * Client Event: Tells the server to update the name of the client.
         */
        setName: function() {
            this.sio.emit('player.setName', { name: vendorName });
        },
        /**
         * Server Event: Adds a unit to the game.
         * @param data
         */
        unitAdd: function(data) {
            var id = data.id,
                name = data.name,
                code = data.code,
                stats = data.stats
            ;
            var unitClass = this.unitClasses[code];
            if (unitClass) {
                var unit = new unitClass();
                this.addEntity(unit);
                unit.metaData(id, name, code);
                this.units.add(unit);
                unit.stats.set(stats);
            }
        },
        /**
         * Server Event: Moves a unit.
         * @param data
         */
        unitSpawn: function(data) {
            var unit = this.units.get(data.id);
            var tile = this.hexgrid.get(data.x, data.y);
            unit.move(tile);
            unit.show();
        },
        unitMove: function(data) {
            var unit = this.units.get(data.id);
            var start = unit.tile;
            var end = this.hexgrid.get(data.x, data.y);
            var nearestPath = this.findNearestPath(start, end);
            nearestPath = [start].concat(nearestPath);
            var hexTiles = this.createTiles(nearestPath, 'hex_target', function(hex, i) {
                hex.alpha = 0;
                hex.scaleX = hex.scaleY = 0.25;
                wol.tween.get(hex)
                    .wait(i * 30)
                    .call(function(){
                        this.add(hex, this.hexContainer);
                     }.bind(this))
                    .to({alpha: 1, scaleX: 1, scaleY: 1}, 500, wol.ease.quartInOut)
                ;
            }.bind(this));
            var moveEnd = function() {
                unit.off('hex.move.end', this);
                wol.each(hexTiles, function(hex, i) {
                    wol.tween.get(hex)
                        .wait(i * 50)
                        .to({alpha:0, scaleX: 0, scaleY: 0}, 300, wol.ease.quartIn)
                        .call(function() {
                            hex.parent.removeChild(hex);
                        });
                });
            };
            unit.on('hex.move.end', moveEnd);
            nearestPath.splice(0,1);
            unit.move(nearestPath);
        },
        /**
         * Client Method:
         * @param unit
         */
        unitRange: function(unit) {
            var range = unit.stats.get('range').value;
            var neighbors = this.hexgrid.neighbors(unit.tile, range);
            this.createTiles(neighbors, 'hex_select', function(hex){
                this.add(hex, this.hexContainer)
            }.bind(this))
        }
    });

});
