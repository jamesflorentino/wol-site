var utils = require('./utils');
var Stats = require('./stats');

function Unit(code, attributes) {
    this.id = utils.uuid();
    this.code = code;
    this.name = attributes.name;
    this.stats = new Stats(attributes.stats);
    this.tile = null;
}
/**
 *
 * @param tile
 */
Unit.prototype.move = function(tile) {
    this.x = tile.x;
    this.y = tile.y;
    this.tile = tile;
};
Unit.prototype.face = function (leftOrRight) {
    this.direction = leftOrRight;
};

module.exports = Unit;