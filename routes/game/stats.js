var Stat = require('./stat');

function Stats() {
    this.list = [];
    this.dictionary = {};
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
 * @param attributes
 */
Stats.prototype.set = function (attributes) {
    var stat;
    var value;
    for (var key in attributes) {
        value = attributes[key];
        if (stat = this.get(key)) {
            console.log('health.......................', key, stat);
            stat.setBase(value);
        } else {
            this.add(new Stat(key, value));
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