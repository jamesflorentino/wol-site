define([

    'wol/wol'

], function(wol) {
    "use strict";

    return wol.Tile = wol.Class.extend({
        init: function(x, y) {
            this.x = x;
            this.y = y;
            this.z = x + y;
        },
        json: function() {
            return {
                x: this.x,
                y: this.y,
                z: this.z
            };
        }
    });


});




