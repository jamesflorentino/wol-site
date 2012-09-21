define(function () {
    function Stat(name, value) {
        this.name = name;
        this.value = value;
        this.max = value;
    }
    /**
     * @param val
     */
    Stat.prototype.setMax = function(val) {
        this.value = val;
        this.max = val;
    };
    /**
     * @param val
     */
    Stat.prototype.setValue = function(val) {
        return this.value = Math.min(
            Math.max(0, val),
            this.max
        );
    };
    Stat.prototype.reset = function() {
        this.value = this.max;
    };
    Stat.prototype.empty = function() {
        this.value = 0;
    };
    return Stat;
});