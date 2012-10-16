define("game/hex", function() {
    return {
        WIDTH: 84,
        HEIGHT: 56,
        position: function(hex, tile, center) {
            var coord = this.coord(tile, center);
            hex.regX = this.WIDTH * 0.5;
            hex.regY = this.HEIGHT * 0.5;
            hex.x = coord.x + hex.regX;
            hex.y = coord.y + hex.regY;
            return coord;
        },
        coord: function(tile, center) {
            if (tile === undefined) {
                return null;
            }
            return {
                x: tile.x * this.WIDTH+ (tile.y % 2 ? this.WIDTH * 0.5 : 0) + (center ? this.WIDTH * 0.5 : 0),
                y: tile.y * (this.HEIGHT - this.HEIGHT * 0.25) + (center ? this.HEIGHT * 0.5 : 0)
            };
        }
    };
});
