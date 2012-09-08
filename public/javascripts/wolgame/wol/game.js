// # wol.Game
// Game instances are responsible for managing entities inside a game session.
// This is intended so that it's easier to create and switch between game instances.
// * * *

//
define([

    'wol/wol'

], function(wol) {

    "use strict";

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
