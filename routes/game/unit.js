var utils = require('./utils');
var Stats = require('./stats');

function Unit(code, attributes) {
    this.id = utils.uuid();
    this.code = code;
    this.name = attributes.name;
    this.stats = new Stats(attributes.stats);
    this.tile = null;
}

Unit.prototype.move = function(tile) {
    this.x = tile.x;
    this.y = tile.y;
    this.tile = tile;
};

module.exports = Unit;