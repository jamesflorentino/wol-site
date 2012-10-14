define([
    'wol/wol',
    'wol/collection',
    'game/base',
    'wol/events',
    'game/entities/marine',
    'game/entities/vanguard'
], function(
    wol,
    Collection,
    Base,
    Events,
    Marine,
    Vanguard
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
            'marine': Marine,
            'vanguard': Vanguard
        },

        /**
         * Sorted Units
         */
        sortedUnits: [],

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
                playerId = data.playerId,
                _this = this
                ;
            var unitClass = this.unitClasses[code];
            var player = this.players.get(playerId);
            if (unitClass && player) {
                var unit = new unitClass({ altUnit: player.index > 1 });
                var tile = this.hexgrid.get(tileX, tileY);
                this.addEntity(unit, id, code, name, playerId);
                this.units.add(unit);
                unit.stats.set(stats);
                unit.move(tile);
                unit.flip(data.direction);
                unit.show();
                // need to know the z-index of the unit
                var resort = (function() {
                    var sortedIndex;
                    _this.sortedUnits.sort(function(a, b) {
                        return a.tile.z - b.tile.z;
                    });
                    sortedIndex = _this.sortedUnits.indexOf(unit);
                    _this.unitContainer.addChildAt(unit.container, sortedIndex);
                });
                _this.sortedUnits.push(unit);
                unit.on('unit.move.node', resort);

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
                barHealthBg.x = -23;
                barHealthBar.y = barHealthBg.y + 1;
                barHealthBar.x = barHealthBg.x + 1;
                unit.container.addChild(barHealthBg);
                unit.container.addChild(barHealthBar);

                // update the health bar whenever the unit takes damage
                unit.on('unit.damage.receive', function(damage) {
                    var healthStatRatio = unit.stats.get('health').ratio();
                    wol.tween.get(barHealthBar).to({
                        scaleX: healthStatRatio
                    }, 100);
                    // show damage indicator
                    _this.unitDamage(unit, damage);
                });

                this.updateUnit(unit);

                resort();
            }
        },

        /**
         *
         * @param unit
         * @return {Number}
         */
        getDepth: function(unit) {
            var index = 0;
            var length = this.sortedUnits.length;
            var _unit;
            for (var i = 0; i < length; i++) {
                _unit = this.sortedUnits[i];
                if (_unit.tile.z > unit.tile.z) {
                    index = i;
                    break;
                }
            }
            return index;
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
         * @param callback
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

        /**
         *
         * @param unit
         * @param targetUnits
         */
        unitAttack: function(unit, targetUnits) {
            var damage = unit.stats.get('damage').value;
            var _this = this;
            var unitAttackEnd = (function () {
                unit.off('unit.attack.end', unitAttackEnd);
                unit.off('unit.attack.hit', unitAttackHit);
                _this.emit('unit.act.end', unit);
                wol.each(targetUnits, function (data) {
                    var targetUnit;
                    if (targetUnit = data.unit) {
                        targetUnit.receiveDamage(data.damage);
                    }
                });
            });
            var unitAttackHit = (function () {
                wol.each(targetUnits, function (data) {
                    var targetUnit;
                    if (targetUnit = data.unit) {
                        targetUnit.hit();
                    }
                });
            });
            var unitAttackStart = (function () {
                wol.each(targetUnits, function (data) {
                    var targetUnit;
                    if (targetUnit = data.unit) {
                        targetUnit.defend();
                    }
                });
                var firstTarget = targetUnits[0].unit;
                unit.attack(firstTarget);
                unit.flip(unit.container.x > firstTarget.container.x ? unit.LEFT : unit.RIGHT);
            });
            if (targetUnits !== null || targetUnits.length > 0) {
                unit.on('unit.attack.end', unitAttackEnd);
                unit.on('unit.attack.hit', unitAttackHit);
                unitAttackStart();
            }
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

        /**
         *
         * @param unit
         */
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
                        _this.unitMove(unit, tile);
                        _this.actUnit(unit);
                        _this.emit('unit.move', { unit: unit, tile: tile });
                    });
                }
            );
            // make the entity remember these tiles.
            this.setHexTiles(unit, 'range', hexRange);
        },

        /**
         *
         * @param unit
         */
        showReach: function(unit) {
            var _this = this;
            var reach = unit.stats.get('reach').value;
            var damage = unit.stats.get('damage').value;
            var neighbors = this.hexgrid.neighbors(unit.currentTile, reach);
            var occupied = wol.filter(neighbors, function(tile) {
                return tile.entity
                    && tile.entity.playerId !== _this.player.id
                    && tile.entity.stats.get('health').value > 0
                    ;
            });
            var hexReach = this.createTiles(occupied, 'hex_attack', function(hex, i) {
                var tile = occupied[i];
                _this.add(hex, _this.hexContainer);
                hex.onClick = (function() {
                    // get all the affected tiles
                    var affectedUnits = (function() {
                        var neighbors = _this.hexgrid.neighbors(unit.tile, unit.stats.get('splash').value);
                        var units = [];
                        var affectedUnit;
                        for(var i= 0, total = neighbors.length; i < total; i++) {
                            affectedUnit = neighbors[i].entity;
                            if (affectedUnit && affectedUnit.stats && affectedUnit.stats.get('health').value > 0) {
                                units.push({
                                    unit: affectedUnit,
                                    damage: damage
                                });
                            }
                        }
                        return units;
                    })();
                    _this.emit('unit.attack', {
                        unit: unit,
                        x: tile.x,
                        y: tile.y
                    });
                    // affected units
                    _this.clearHexTiles(unit, 'reach range');
                    _this.unitAttack(unit, affectedUnits);
                    _this.actUnit(unit);
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
                } else {
                    this.activeUnit = null;
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
            if (unit && unit.hexTiles) {
                unit.hexTiles.clear(type, function (hexTiles) {
                    var i, hex, _len = hexTiles.length;
                    for (i=0; i<_len; i++) {
                        hex = hexTiles[i];
                        hex.parent.removeChild(hex);
                    }
                    //_this.hexContainer.removeChild.apply(_this.hexContainer, hexTiles);
                });
            }
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
            var _this = this;
            if (this.activeUnit) {
                this.activeUnit.hexTiles.get('playerSide')[0].visible = true;
                this.clearHexTiles(this.activeUnit, 'active');
            }
            // get the texture from the buffer and use it as an image resource
            hexSelect = this.getTexture('hex_player_selected');
            hexSelect.regX = 107 * 0.5;
            hexSelect.regY = 75 * 0.5;
            hexSelect.onClick = (function() {
                _this.emit('unit.show.move', unit);
            });
            hexPlayerSide = unit.hexTiles.get('playerSide')[0];
            hexPlayerSide.visible = false;
            unit.container.addChildAt(hexSelect, hexPlayerSide.parent.getChildIndex(hexPlayerSide) + 1);
            unit.hexTiles.set('active', [hexSelect]);
            this.activeUnit = unit;
        },

        /**
         * @param unit - targeted unit
         * @param damage - value to be reduced from the unit's hit points
         */
        unitDamage: function(unit, damage) {
            var damageArray;
            var dimensions;
            var prevX;
            var unitY;
            var targetY;
            var _this = this;
            prevX = unit.container.x;
            unitY = unit.container.y - 100;
            targetY = unitY - 10;
            damageArray = String(damage).split('');
            wol.each(damageArray, function(damageString, i) {
                var frameName = 'damage_' + damageString;
                var damageText = _this.getTexture(frameName);
                dimensions = _this.getTextureSize(damageText);
                prevX += dimensions.width;
                damageText.x = prevX;
                damageText.y = unitY;
                damageText.alpha = 0;
                _this.add(damageText, _this.unitContainer);
                //_this.unitContainer.addChild(damageText);
                wol.tween.get(damageText)
                    .wait(i * 50)
                    .to({ y: targetY, alpha: 1 }, 300, wol.ease.backInOut)
                    .wait(1000).call(function() {
                        _this.unitContainer.removeChild(damageText);
                    });
            });

        }
    });
});
