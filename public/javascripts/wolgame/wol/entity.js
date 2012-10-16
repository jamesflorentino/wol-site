define(function(require) {

    var wol = require('wol/wol');
    var SpriteSheetComponent = require('wol/components/spritesheet');
    var EventComponent = require('wol/components/events');

    wol.components.add('spritesheet', SpriteSheetComponent);
    wol.components.add('events', EventComponent);

    return wol.Entity = wol.Class.extend({
        init:function () {
            this._components = [];
            // This container is where all our visual animations and graphics will be placed.
            this.container = wol.create.container();
        },
        LEFT:'left',

        RIGHT:'right',

        /**
         *
         * @param direction
         */
        flip:function (direction) {
            this.container.scaleX = direction === this.LEFT ? -1 : 1;
            //this.container.scaleX = Math.random() > 0.5 ? -1 : 1;
        },

        /**
         *
         * @param name
         */
        addComponent:function (name) {
            var component, args;
            if (this._components.indexOf(name) > -1) {
                return;
            }
            if (component = wol.components.get(name)) {
                args = Array.prototype.slice.call(arguments);
                args.splice(0, 1);
                args.splice(0, 0, this);
                component.apply(this, args);
                this._components.push(name);
            }
        }
    });
});
