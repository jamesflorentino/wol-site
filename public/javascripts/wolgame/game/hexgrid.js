define(function(require, exports, module){
    var wol = require('../wol/wol'),
        Grid = require('../wol/grid');

    var HexGrid = {
        EAST: 'east',
        WEST: 'west',
        SOUTHEAST: 'southEast',
        NORTHEAST: 'northEast',
        SOUTHWEST: 'southWest',
        NORTHWEST: 'northWest',
        // calculates adjacent Y coordinate based on index and radius
        deltaX: function(direction, isOddRow, index, i) {
            var result;
            if (index == null) index = 1;
            if (i == null) i = 0;
            result = 0;
            switch (direction) {
                case this.EAST:
                    result += (isOddRow ? Math.floor(i * 0.5) * -1 : Math.ceil(i * 0.5) * -1) + index;
                    break;
                case this.WEST:
                    result += (isOddRow ? Math.ceil(i * 0.5) : Math.floor(i * 0.5)) - index;
                    break;
                case this.SOUTHEAST:
                    result += (isOddRow ? Math.ceil(index * 0.5) : Math.floor(index * 0.5)) - i;
                    break;
                case this.NORTHEAST:
                    result += Math.floor(index * 0.5) + i - Math.floor(i * 0.5);
                    if (isOddRow) {
                        if (index % 2 && (index + i) % 2) result++;
                    } else {
                        if (index % 2 === 0 && (index + i) % 2) result--;
                    }
                    break;
                case this.SOUTHWEST:
                    result -= Math.ceil(index * 0.5) + i - Math.ceil(i * 0.5);
                    if (isOddRow) {
                        if (index % 2 && (index + i) % 2) result++;
                    } else {
                        if (index % 2 === 0 && (index + i) % 2) result--;
                    }
                    break;
                case this.NORTHWEST:
                    result += (isOddRow ? Math.ceil(index * -0.5) : Math.floor(index * -0.5)) + i;
            }
            return result;
        },
        // calculates adjacent Y coordinate based on index and radius
        deltaY: function(direction, isOddRow, index, i) {
            var result;
            if (index == null) index = 1;
            if (i == null) i = 0;
            result = 0;
            switch (direction) {
                case this.EAST:
                    result += i;
                    break;
                case this.WEST:
                    result += i * -1;
                    break;
                case this.SOUTHEAST:
                    result += index;
                    break;
                case this.SOUTHWEST:
                    result += index - i;
                    break;
                case this.NORTHEAST:
                    result += (index * -1) + i;
                    break;
                case this.NORTHWEST:
                    result += index * -1;
            }
            return result;
        },
        // calculates adjacent Y coordinate based on index and radius
        delta: function(centerX, centerY, direction, isOddRow, index) {
            var i, result, tile, dx, dy;
            result = [];
            for (i = 1; 1 <= index ? i <= index : i >= index; 1 <= index ? i++ : i--) {
                dx = centerX + this.deltaX(direction, isOddRow, index, i - 1);
                dy = centerY + this.deltaY(direction, isOddRow, index, i - 1);
                tile = this.get(dx, dy);
                if (tile) {
                    result.push(tile);
                }
            }
            return result;
        },

        neighbors: function(tile, radius) {
            var centerX, centerY, east, i, isOddRow, result, northEast, northWest, southEast, southWest, west;
            if (radius == null) radius = 1;
            centerX = tile.x;
            centerY = tile.y;
            result = [];
            isOddRow = centerY % 2 > 0;
            for (i = 1; 1 <= radius ? i <= radius : i >= radius; 1 <= radius ? i++ : i--) {
                east = this.delta(centerX, centerY, this.EAST, isOddRow, i);
                result = result.concat(east);
                west = this.delta(centerX, centerY, this.WEST, isOddRow, i);
                result = result.concat(west);
                southEast = this.delta(centerX, centerY, this.SOUTHEAST, isOddRow, i);
                result = result.concat(southEast);
                northEast = this.delta(centerX, centerY, this.NORTHEAST, isOddRow, i);
                result = result.concat(northEast);
                southWest = this.delta(centerX, centerY, this.SOUTHWEST, isOddRow, i);
                result = result.concat(southWest);
                northWest = this.delta(centerX, centerY, this.NORTHWEST, isOddRow, i);
                result = result.concat(northWest);
            }
            return result;
        },

        /**
         * Finding nearest heuristics
         * @param start
         * @param destination
         * @return {Number}
         */
        euclidean: function(start, destination) {
            var vectorX, vectorY;
            vectorX = Math.pow(start.x - destination.x, 2);
            vectorY = Math.pow(start.y - destination.y, 2);
            return Math.sqrt(vectorX + vectorY);
        }
    };

    return module.exports = Grid.extend(HexGrid);
});