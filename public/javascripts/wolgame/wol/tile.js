define([

    'wol/wol'

], function(wol) {
    "use strict";

    return wol.Tile = wol.Class.extend({
        init: function(x, y) {
            this.x = x;
            this.y = y;
            this.z = x + y;
            this.f = 0;
            this.g = 0;
            this.h = 0;
            this.parent = null;
        },
        json: function() {
            return {
                x: this.x,
                y: this.y,
                z: this.z
            };
        },
        pos: function() {
            return this.x + "." + this.y;
        }
    });


});




