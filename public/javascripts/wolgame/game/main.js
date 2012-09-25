define([
    'wol/wol',
    'wol/collection',
    'game/base',
    'game/entities/marine',
    'wol/events'

], function(
    wol,
    Collection,
    Base,
    Marine,
    Events
    ) {

    "use strict";

    var vendorName = navigator.vendor.replace(/(^\w+).+/, function (a, b) {
        return b;
    });

    return Base.extend({
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
        activeUnit: null,
        /**
         * entry point
         */
        init: function() {
            this.parent();
            this.hexContainer.y = this.unitContainer.y = 150;
            this.hexContainer.x = this.unitContainer.x = 80;
            var events = new Events();
            this.on = events.on.bind(events);
            this.off = events.off.bind(events);
            this.emit = events.emit.bind(events);
        },
        /**
         * add a player to the collection
         * @param data
         */
        addPlayer: function(data) {
            this.players.add({
                id: data.id,
                name: data.name
            });
        },
        /**
         * Server Event: Adds a unit to the game.
         * @param data
         */
        unitSpawn: function(data) {
            var id = data.id,
                name = data.name,
                code = data.code,
                stats = data.stats,
                tileX = data.x,
                tileY = data.y,
                playerId = data.playerId,
                _this = this
                ;
            var unitClass = this.unitClasses[code];
            if (unitClass) {
                var unit = new unitClass();
                var tile = this.hexgrid.get(tileX, tileY);
                this.addEntity(unit, id, code, name, playerId);
                this.units.add(unit);
                unit.stats.set(stats);
                unit.move(tile);
                unit.flip(data.direction);
                unit.show();
                this.updateUnit(unit);
            }
        },

        updateUnit: function(unit) {
            var _this = this,
                playerSide;
            playerSide = unit.playerId === this.player.id ? 'hex_player_a' : 'hex_player_b';
            var hexTiles = this.createTiles([unit.tile], playerSide, function(hex) {
                _this.add(hex, _this.hexContainer);
            });
            this.setHexTiles(unit, 'playerSide', hexTiles);
            this.emit('unit.update', unit);
        },

        /**
         *
         * @param unit
         * @param end
         */
        unitMove: function(unit, end, callback) {
            var _this = this;
            var start = unit.tile;
            var nearestPath = this.findNearestPath(start, end);
            nearestPath = [start].concat(nearestPath);
            var hexTiles = this.createTiles(nearestPath, 'hex_target', function(hex, i) {
                _this.add(hex, _this.hexContainer);
            });
            this.setHexTiles(unit, 'move', hexTiles);
            var moveEnd = (function() {
                unit.off('hex.move.end', moveEnd);
                _this.clearHexTiles(unit);
                _this.updateUnit(unit);
                if (wol.isFunction(callback)) callback();
            });
            unit.on('hex.move.end', moveEnd);
            nearestPath.splice(0,1);
            unit.move(nearestPath);
        },
        /**
         *
         * @param unit
         */
        unitRange: function(unit) {
            var range;
            var neighbors;
            var _this = this;
            var hexContainer = this.hexContainer;
            // disregard if the unit is disabled or if there's still
            // a currently generated list of hexTiles.
            if (!unit.disabled && unit.hexTiles.get('range').length === 0) {
                range = unit.stats.get('range').value;
                neighbors = this.hexgrid.neighbors(unit.tile, range);
                var hexTiles =
                    this.createTiles(neighbors, 'hex_select',
                        function(hex, i){
                            var tile = neighbors[i];
                            _this.add(hex, hexContainer);
                            hex.onClick = (function() {
                                unit.disable();
                                _this.clearHexTiles(unit);
                                _this.unitMove(unit, tile, function() {
                                    _this.actUnit(unit);
                                    _this.checkTurn(unit);
                                });
                            });
                        }
                    );
                // make the entity remember these tiles.
                this.setHexTiles(unit, 'range', hexTiles);
            }
        },

        actUnit: function(unit, cost) {
            cost || (cost = 1);
            var actions;
            var difference;
            if (unit) {
                actions = unit.stats.get('actions');
                difference = actions.value - cost;
                actions.setValue(difference);
            }
        },

        checkTurn: function(unit) {
            if (unit === this.activeUnit) {
                var actionStat;
                actionStat = unit.stats.get('actions');
                this.emit('unit.update', unit);
                if (actionStat.value > 0) {
                    unit.enable();
                }
            }
        },

        clearHexTiles: function(unit, type) {
            var _this = this;
            unit.hexTiles.clear(type, function(hexTiles){
                _this.hexContainer.removeChild.apply(_this.hexContainer, hexTiles);
            });
        },

        setHexTiles: function(unit, type, hexTiles) {
            this.clearHexTiles(unit);
            unit.hexTiles.set(type, hexTiles);
        }
    });

});
