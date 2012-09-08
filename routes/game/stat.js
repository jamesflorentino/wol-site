var Stat = function() {
    function Stat(name, value) {
        this.name = name;
        this.value = value;
        this.max = value;
    }
    Stat.prototype.setMax = function(val) {
        this.value = val;
        this.max = val;
    };
    Stat.prototype.setValue = function(val) {
        this.value = val;
    };
    return Stat;
};

module.exports = Stat();