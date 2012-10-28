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

    // basic health
    this.stats.add(new Stat('health', 800));
    // base damage
    this.stats.add(new Stat('damage', 200));
    // number of tiles it can move in an action.
    this.stats.add(new Stat('range', 2));
    // number of tiles it can hit its target
    this.stats.add(new Stat('reach', 1));
    // how many action points the unit has. default is 3.
    this.stats.add(new Stat('actions', 3));
    // gets filled up by 1 bar, when it reaches max
    // the unit gets its turn.
    this.stats.add(new Stat('recharge', 5));
    // Radius to the damage done to a tile.
    this.stats.add(new Stat('splash', 0));
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
    if (this.tile) {
        this.tile.vacate();
    }
    this.tile = tile;
    this.tile.occupy(this);
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