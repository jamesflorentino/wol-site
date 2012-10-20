define(function(require, exports, module) {
    "use strict";

    var wol = require('./wol');
    var Class = require('./class');
    var SpriteSheetComponent = require('./components/spritesheet');
    var EventComponent = require('./components/events');

    wol.components.add('spritesheet', SpriteSheetComponent);
    wol.components.add('events', EventComponent);

    var Entity = {
        LEFT:'left',
        RIGHT:'right',
        init:function () {
            this._components = [];
            // This container is where all our visual animations and graphics will be placed.
            this.container = wol.create.container();
        },

        /**
         *
         * @param direction
         */
        flip:function (direction) {
            this.container.scaleX = direction === this.LEFT ? -1 : 1;
        },

        /**
         *
         * @param name
         */
        addComponent:function (name) {
            var component, args;
            if (this._components.indexOf(name) === -1) {
                if (component = wol.components.get(name)) {
                    args = Array.prototype.slice.call(arguments);
                    args.splice(0, 1);
                    args.splice(0, 0, this);
                    component.apply(this, args);
                    this._components.push(name);
                }
            }
        }
    };

    return module.exports = Class.extend(Entity);
});
