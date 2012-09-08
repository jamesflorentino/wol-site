function Tile(x, y) {
    this.x = x;
    this.y = y;
    this.z = x + y;
}
Tile.prototype.toJSON = function() {
    return {
        x: this.x,
        y: this.y,
        z: this.z
    }
};


module.exports = Tile;