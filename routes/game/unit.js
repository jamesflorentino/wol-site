var utils = require('./utils');
var events = require('events');
var util = require('util');
var Stats = require('./stats');
var Stat = require('./stat');

function Unit(code, attributes) {
    this.id = utils.uuid();
    this.code = code;
    this.name = attributes.name;
    this.stats = new Stats();
    this.tile = null;

    // load the default
    this.stats.add(new Stat('health', 800));
    this.stats.add(new Stat('damage', 200));
    this.stats.add(new Stat('speed', 10));
    this.stats.add(new Stat('range', 2));
    this.stats.add(new Stat('reach', 4));
    this.stats.add(new Stat('actions', 3));
    this.stats.add(new Stat('recharge', 5));

    // override stats with custom settings
    this.stats.set(attributes.stats);

    events.EventEmitter.call(this);
}

util.inherits(Unit, events.EventEmitter);

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

Unit.prototype.recharge = function(value) {
    value || (value = 1);
    var recharge = this.stats.get('recharge');
    return recharge.setValue(recharge.value + value);
};

Unit.prototype.act = function(cost) {
    var actions = this.stats.get('actions');
    actions.setValue(actions.value - cost);
};

module.exports = Unit;