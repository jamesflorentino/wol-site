(function() {
    var Stat = (function() {
        function Stat(name, value) {
            this.name = name;
            this.value = value;
            this.max = value;
        }
        Stat.prototype.setBase = function(val) {
            this.value = this.max = val;
        }
        Stat.prototype.setMax = function(val) {
            this.max = val;
        };
        Stat.prototype.setValue = function(val) {
            return this.value = Math.max(Math.min(val, this.max), 0);
        };
        Stat.prototype.empty = function() {
            this.value = 0;
        };
        Stat.prototype.reduce = function(val) {
            this.setValue(this.value - val);
        };
        Stat.prototype.reset = function(val) {
            this.value = this.max;
        };
        return Stat;
    })();

    if (typeof define == 'function' && typeof define.amd == 'object' && define.amd) {
        define(function() {
            return Stat;
        });
    }
    if (typeof module == 'object' && module) {
        module.exports = Stat;
    }
})();
