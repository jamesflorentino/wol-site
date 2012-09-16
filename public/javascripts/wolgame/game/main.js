define([
    'wol/wol',
    'wol/collection',
    'game/base',
    'game/entities/marine'

], function(
    wol,
    Collection,
    Base,
    Marine
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
        init: function() {
            this.parent();
            this.hexContainer.y = this.unitContainer.y = 150;
            this.hexContainer.x = this.unitContainer.x = 80;
        },
        /**
         * Spawn units in the game
         * @param unitCode
         * @param point
         * @param direction
         */
        unitSpawn: function(unitCode, point, direction) {
            var unitClass = this.unitClasses[unitCode];
            if (unitClass) {
                var unit = new unitClass();
                var tile = this.hexgrid.get(point.x, point.y);
                this.addEntity(unit, id, code, name);
                this.units.add(unit);
                unit.stats.set(stats);
                unit.move(tile);
                unit.flip(direction);
                unit.show();
            }
        },
        unitMove: function(unit, point) {
            var start = unit.tile;
            var end = this.hexgrid.get(point.x, point.y);
            var nearestPath = this.findNearestPath(start, end);
            nearestPath = [start].concat(nearestPath);
            var hexTiles = this.createTiles(nearestPath, 'hex_target', function(hex, i) {
                hex.alpha = 0;
                hex.scaleX = hex.scaleY = 0.25;
                wol.tween.get(hex)
                    .wait(i * 50)
                    .call(function(){
                        this.add(hex, this.hexContainer);
                     }.bind(this))
                    .to({alpha: 1, scaleX: 1, scaleY: 1}, 500, wol.ease.cubicOut)
                ;
            }.bind(this));
            var moveEnd = function() {
                unit.off('hex.move.end', this);
                wol.each(hexTiles, function(hex, i) {
                    wol.tween.get(hex)
                        .wait(i * 50)
                        .to({alpha:0, scaleX: 0.25, scaleY: 0.25}, 300, wol.ease.quintIn)
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
