define('wol/game', function(require, exports, module) {

    var wol = require('./wol'),
        Class = require('./class')
        ;

    var Game = {

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

    };

    return module.exports = Class.extend(Game);

})
