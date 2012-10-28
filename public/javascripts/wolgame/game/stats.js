define(function (require, exports, module) {
    "use strict";
    var Stat = require('./stat');

    function Stats(stats) {
        this.list = [];
        this.dictionary = {};
        this.set(stats);
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
    Stats.prototype.set = function (stats) {
        var stat;
        var keyValue;
        var value;
        var max;
        for (var key in stats) {
            keyValue = stats[key];
            if (typeof keyValue === 'object' && keyValue.max && keyValue.value) {
                value = keyValue.value;
                max = keyValue.max;
            } else if (typeof keyValue === 'number') {
                max = value = keyValue;
            }
            if (stat = this.get(key)) {
                stat.setMax(max);
                stat.setValue(value);
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
        var stat;
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

    return Stats;
});