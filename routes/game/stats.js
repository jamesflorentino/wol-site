var Stat = require('./stat');

function Stats(stats) {
    this.list = [];
    this.dictionary = {};
    this.add(new Stat('health', 800));
    this.add(new Stat('attack', 200));
    this.add(new Stat('speed', 10));
    this.add(new Stat('range', 2));
    this.overrideStats(stats);
}
/**
 * Add an attribute
 * @param stat
 */
Stats.prototype.add = function(stat) {
    if(stat) {
        this.list.push(stat);
        this.dictionary[stat.name] = stat;
    }
};
/**
 * Override existing stat data.
 * @param stats
 */
Stats.prototype.overrideStats = function (stats) {
    var stat;
    var value;
    for (var key in stats) {
        value = stats[key];
        if (stat = this.get(key)) {
            stat.setMax(value);
        }
    }
};
/**
 * Returns a re-parsed json equivalent.
 * @return {Object}
 */
Stats.prototype.toJSON = function() {
    var attr = {};
    for(var i=0; i<this.list.length;i++) {
        stat = this.list[i];
        attr[stat.name] = {
            value: stat.value,
            max: stat.max
        };
    }
    return attr;
};
/**
 * returns a Stat Object
 * @param name
 * @return {Stat}
 */
Stats.prototype.get = function(name) {
    return this.dictionary[name];
};

module.exports = Stats;