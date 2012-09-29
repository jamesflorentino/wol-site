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
        init: function () {
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
        addPlayer: function (data) {
            this.players.add(data);
        },
        /**
         * Server Event: Adds a unit to the game.
         * @param data
         */
        unitSpawn: function (data) {
            var id = data.id,
                name = data.name,
                code = data.code,
                stats = data.stats,
                tileX = data.x,
                tileY = data.y,
                playerId = data.playerId
                ;
            var unitClass = this.unitClasses[code];
            var player = this.players.get(playerId);
            if (unitClass && player) {
                console.log(player);
                var unit = new unitClass({ altUnit: player.index > 1 });
                var tile = this.hexgrid.get(tileX, tileY);
                this.addEntity(unit, id, code, name, playerId);
                this.units.add(unit);
                unit.stats.set(stats);
                unit.move(tile);
                unit.flip(data.direction);
                unit.show();
                // show the player side indicator
                var hexPlayerSide = this.getTexture(
                    unit.playerId === this.player.id ? 'hex_player_a' : 'hex_player_b'
                );
                hexPlayerSide.regX = 81 * 0.5;
                hexPlayerSide.regY = 49 * 0.5;
                unit.container.addChildAt(hexPlayerSide, 0);
                unit.hexTiles.set('playerSide', [hexPlayerSide]);
                // add a health gauge in the list
                var barHealthBg = this.getTexture('bar_health_bg');
                var barHealthBar = this.getTexture('bar_health');
                barHealthBg.y = -100;
                barHealthBar.y = barHealthBg.y + 1;
                unit.container.addChild(barHealthBg);
                unit.container.addChild(barHealthBar);
                this.updateUnit(unit);
            }
        },

        /**
         *
         * @param unit
         */
        updateUnit: function (unit) {
            this.emit('unit.update', unit);
        },

        /**
         *
         * @param unit
         * @param end
         */
        unitMove: function (unit, end, callback) {
            var _this = this;
            var start = unit.tile;
            var nearestPath;
            nearestPath = [start].concat(this.findNearestPath(start, end));
            var hexTiles = this.createTiles(nearestPath, 'hex_target', function (hex, i) {
                _this.add(hex, _this.hexContainer);
            });
            this.setHexTiles(unit, 'move', hexTiles);
            var moveEnd = (function () {
                unit.off('hex.move.end', moveEnd);
                _this.clearHexTiles(unit, 'move');
                _this.updateUnit(unit);
                _this.emit('unit.act.end', unit);
                if (wol.isFunction(callback)) callback();
            });
            unit.on('hex.move.end', moveEnd);
            nearestPath.splice(0, 1);
            unit.move(nearestPath);
        },

        unitAttack: function(unit, target) {
            var unitAttack, unitAttackHit;
            var damage = unit.stats.get('damage').value;
            var _this = this;
            //
            unitAttack = (function() {
                unit.off('unit.attack.end', unitAttack);
                unit.off('unit.attack.hit', unitAttackHit);
                _this.emit('unit.act.end', unit);
                target.stats.get('health').reduce(damage);
                if (target.stats.get('health').value === 0) {
                    target.die();
                } else {
                    target.defendEnd();
                }
            });
            unitAttackHit = (function() {
                target.hit();
            });
            unit.on('unit.attack.end', unitAttack);
            unit.on('unit.attack.hit', unitAttackHit);
            unit.attack(target);
            unit.flip(unit.container.x > target.container.x ? unit.LEFT : unit.RIGHT);
        },

        /**
         *
         * @param unit
         */
        unitRange: function (unit) {
            // disregard if the unit is disabled or if there's still
            // a currently generated list of hexTiles.
            if (!unit.disabled) {
                if (unit.hexTiles.get('range').length === 0) {
                    this.showRange(unit);
                    this.showReach(unit);
                }
            }
        },

        showRange: function(unit) {
            var _this = this;
            var range = unit.stats.get('range').value;
            var neighbors = this.hexgrid.neighbors(unit.currentTile, range);
            var vacant = wol.filter(neighbors, function(tile) {
                return !tile.entity;
            });
            var hexRange = this.createTiles(vacant, 'hex_select',
                function (hex, i) {
                    var tile = vacant[i];
                    _this.add(hex, _this.hexContainer);
                    hex.onClick = (function () {
                        unit.disable();
                        _this.clearHexTiles(unit, 'range reach');
                        _this.emit('unit.move', { unit: unit, tile: tile });
                        _this.actUnit(unit);
                        _this.unitMove(unit, tile);
                    });
                }
            );
            // make the entity remember these tiles.
            this.setHexTiles(unit, 'range', hexRange);
        },

        showReach: function(unit) {
            var _this = this;
            var reach = unit.stats.get('reach').value;
            var neighbors = this.hexgrid.neighbors(unit.currentTile, reach);
            var occupied = wol.filter(neighbors, function(tile) {
                return tile.entity
                    //&& tile.entity.playerId !== _this.player.id
                    && tile.entity.stats.get('health').value > 0
                    ;
            });
            var hexReach = this.createTiles(occupied, 'hex_attack', function(hex, i) {
                var tile = occupied[i];
                _this.add(hex, _this.hexContainer);
                hex.onClick = (function() {
                    var target = tile.entity;
                    _this.unitAttack(unit, target);
                    _this.clearHexTiles(unit, 'reach range');
                    _this.actUnit(unit);
                    _this.emit('unit.attack', {
                        unit: unit,
                        target: target
                    });
                });
            });
            this.setHexTiles(unit, 'reach', hexReach);
        },

        /**
         * @param unit
         */
        cancelUnitOptions: function(unit) {
            this.clearHexTiles(unit, 'range reach');
        },

        /**
         *
         * @param unit
         * @param cost
         */
        actUnit: function (unit, cost) {
            cost || (cost = 1);
            var actions;
            var difference;
            if (unit) {
                actions = unit.stats.get('actions');
                difference = actions.value - cost;
                actions.setValue(difference);
                this.checkTurn(unit);
                this.emit('unit.act', unit);
            }
        },

        /**
         *
         * @param unit
         */
        checkTurn: function (unit) {
            if (unit === this.activeUnit) {
                var actionStat;
                actionStat = unit.stats.get('actions');
                this.emit('unit.update', unit);
                if (actionStat.value > 0) {
                    unit.enable();
                }
            }
        },

        /**
         *
         * @param unit
         * @param type
         */
        clearHexTiles: function (unit, type) {
            var _this = this;
            unit.hexTiles.clear(type, function (hexTiles) {
                var i, hex, _len = hexTiles.length;
                for (i=0; i<_len; i++) {
                    hex = hexTiles[i];
                    hex.parent.removeChild(hex);
                }
                //_this.hexContainer.removeChild.apply(_this.hexContainer, hexTiles);
            });
        },

        /**
         *
         * @param unit
         * @param type
         * @param hexTiles
         */
        setHexTiles: function (unit, type, hexTiles) {
            this.clearHexTiles(unit, type);
            unit.hexTiles.set(type, hexTiles);
        },

        setUnitActive: function(unit) {
            // clear the previous activeUnit object's active hex sprite
            var hexSelect;
            var hexPlayerSide;
            if (this.activeUnit) {
                this.activeUnit.hexTiles.get('playerSide')[0].visible = true;
                this.clearHexTiles(this.activeUnit, 'active');
            }
            // get the texture from the buffer and use it as an image resource
            hexSelect = this.getTexture('hex_player_selected');
            hexSelect.regX = 107 * 0.5;
            hexSelect.regY = 75 * 0.5;
            hexPlayerSide = unit.hexTiles.get('playerSide')[0];
            hexPlayerSide.visible = false;
            unit.container.addChildAt(hexSelect, hexPlayerSide.parent.getChildIndex(hexPlayerSide) + 1);
            unit.hexTiles.set('active', [hexSelect]);
            this.activeUnit = unit;
        }
    });
});
