(function() {
    function Tile(x, y, index) {
        this.x = x;
        this.y = y;
        this.z = index;
        this.f = 0;
        this.g = 0;
        this.h = 0;
        this.parent = null;
        this.id = x + '_' + y;
    }

    Tile.prototype = {
        json: function() {
            return {
                x: this.x,
                y: this.y,
                z: this.z
            };
        },
        pos: function() {
            return this.x + "." + this.y;
        },

        occupy: function(entity) {
            this.entity = entity;
        },

        vacate: function() {
            this.entity = null;
        },
        toJSON: function() {
            return {
                x: this.x,
                y: this.y,
                z: this.z
            }
        }
    };

    if (typeof define == 'function' && typeof define.amd == 'object' && define.amd) {
        define(function() {
            return Tile;
        });
    }
    if (typeof module == 'object' && module) {
        module.exports = Tile;
    }
})();