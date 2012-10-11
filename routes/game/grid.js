var Tile = require('./tile');

function Grid() {
    this.columns = 0;
    this.rows = 0;
    this._keys = {};
    this.tiles = [];
}
Grid.prototype.EAST = 'east';
Grid.prototype.WEST = 'west';
Grid.prototype.SOUTHEAST = 'southEast';
Grid.prototype.NORTHEAST = 'northEast';
Grid.prototype.SOUTHWEST = 'southWest';
Grid.prototype.NORTHWEST = 'northWest';
/**
 * Generates a list of tiles
 * @param columns
 * @param rows
 */
Grid.prototype.generate = function(columns, rows) {
    var row, col, tile;
    this.columns = columns;
    this.rows = rows;
    for(col = 0; col < columns; col++) {
        this._keys[col] = {};
        for(row = 0; row < rows; row++) {
            tile = new Tile(col, row);
            this._keys[col][row] = tile;
            this.tiles.push(tile);
        }
    }
};
/**
 * Retrieves a tile from the selection
 * @param x
 * @param y
 * @return {*}
 */
Grid.prototype.get = function(x, y) {
    return !this._keys[x] ? null : this._keys[x][y];
};
Grid.prototype.deltaX = function(direction, isOddRow, radius, index) {
    var result;
    if (radius == null) radius = 1;
    if (index == null) index = 0;
    result = 0;
    switch (direction) {
        case this.EAST:
            result += (isOddRow ? Math.floor(index * 0.5) * -1 : Math.ceil(index * 0.5) * -1) + radius;
            break;
        case this.WEST:
            result += (isOddRow ? Math.ceil(index * 0.5) : Math.floor(index * 0.5)) - radius;
            break;
        case this.SOUTHEAST:
            result += (isOddRow ? Math.ceil(radius * 0.5) : Math.floor(radius * 0.5)) - index;
            break;
        case this.NORTHEAST:
            result += Math.floor(radius * 0.5) + index - Math.floor(index * 0.5);
            if (isOddRow) {
                if (radius % 2 && (radius + index) % 2) result++;
            } else {
                if (radius % 2 === 0 && (radius + index) % 2) result--;
            }
            break;
        case this.SOUTHWEST:
            result -= Math.ceil(radius * 0.5) + index - Math.ceil(index * 0.5);
            if (isOddRow) {
                if (radius % 2 && (radius + index) % 2) result++;
            } else {
                if (radius % 2 === 0 && (radius + index) % 2) result--;
            }
            break;
        case this.NORTHWEST:
            result += (isOddRow ? Math.ceil(radius * -0.5) : Math.floor(radius * -0.5)) + index;
    }
    return result;
};
/**
 * calculates adjacent Y coordinate based on index and radius
 * @param direction
 * @param isOddRow
 * @param radius
 * @param index
 * @return {Number}
 */
Grid.prototype.deltaY = function(direction, isOddRow, radius, index) {
    var result;
    if (radius == null) radius = 1;
    if (index == null) index = 0;
    result = 0;
    switch (direction) {
        case this.EAST:
            result += index;
            break;
        case this.WEST:
            result += index * -1;
            break;
        case this.SOUTHEAST:
            result += radius;
            break;
        case this.SOUTHWEST:
            result += radius - index;
            break;
        case this.NORTHEAST:
            result += (radius * -1) + index;
            break;
        case this.NORTHWEST:
            result += radius * -1;
    }
    return result;
};
/**
 * Calculates adjacent Y coordinate based on index and radius
 * @param centerX
 * @param centerY
 * @param direction
 * @param isOddRow
 * @param radius
 * @return {Array}
 */
Grid.prototype.delta = function(centerX, centerY, direction, isOddRow, radius) {
    var i, result, tile, dx, dy;
    result = [];
    for (i = 1; 1 <= radius ? i <= radius : i >= radius; 1 <= radius ? i++ : i--) {
        dx = centerX + this.deltaX(direction, isOddRow, radius, i - 1);
        dy = centerY + this.deltaY(direction, isOddRow, radius, i - 1);
        tile = this.get(dx, dy);
        if (tile) {
            result.push(tile);
        }
    }
    return result;
};
/**
 * Returnss a list of neighbors the current tile has.
 * @param tile
 * @param radius
 * @return {Array}
 */
Grid.prototype.neighbors = function(tile, radius) {
    var centerX, centerY, east, i, isOddRow, result, northEast, northWest, southEast, southWest, west;
    if (radius == null) radius = 1;
    centerX = tile.x;
    centerY = tile.y;
    result = [];
    isOddRow = centerY % 2 > 0;
    //for (i = 1; 1 <= radius ? i <= radius : i >= radius; 1 <= radius ? i++ : i--) {
    for (i=1; i <= radius; i++) {
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
};
/**
 * A heuristics value for the hex path-finding algorithm.
 * @param start
 * @param destination
 * @return {Number}
 */
Grid.prototype.euclidean = function(start, destination) {
    var vectorX, vectorY;
    vectorX = Math.pow(start.x - destination.x, 2);
    vectorY = Math.pow(start.y - destination.y, 2);
    return Math.sqrt(vectorX + vectorY);
};
module.exports = Grid;
