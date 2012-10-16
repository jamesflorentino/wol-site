define('wol/game', function(require) {

    var wol = require('wol/wol')
        ;

    return wol.Game = wol.Class.extend({

        init: function() {
            // create a fresh container
            this.container = wol.create.container();
            // add the container to the main display list;
            wol.display.add(this.container);
        },

        add: function(objA, objB) {
            if (objB === undefined) {
                this.container.addChild(objA);
            } else if(objA) {
                objB.addChild(objA);
            }
            return this;
        }

    });

})
