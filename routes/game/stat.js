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
}
module.exports = Stat;