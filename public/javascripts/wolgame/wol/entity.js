// # wol.entity
// And entity is an element that interacts with other entities in the game.
// A hero is an entity and so is an enemy. Entities can have prototype properties and
// methods.
// * * *

//
define([

    'wol/wol',
    'wol/events'

], function(wol, Events) {

    "use strict";

    // spritesheet (component)
    // ------------------------
    // A spritesheet component allows the entity to have the API
    // for animation playback.
    wol.components.add('spritesheet', function(entity, spritesheet) {
        // The animation will be resonsible
        var animation = wol.create.animation(spritesheet);
        //
        entity.container.addChild(animation);
        // ### entity.play (frameName)
        // Forwards the timeline of the spritesheet to a certain frame name.
        entity.play = function(frame) {
            animation.gotoAndPlay.apply(animation, arguments);
            return entity;
        };
        // ### entity.stop (frameName)
        // Halts the animation to a certain keyframe name.
        entity.stop = function(frame) {
            animation.gotoAndStop.apply(animation, arguments);
            return entity;
        };
        // ### entity.sequence(animA, animB)
        // Instructs the bitmap animation to play the next animation after one
        // finishes.
        entity.sequence = function(from, to) {
            var fromA;
            if( fromA = animation.spriteSheet.getAnimation(from)) {
                fromA.next = to;
            }
            return entity;
        }
    });

    // events (component)
    // -----------------
    // Enables the entity to have event emitters that can be used to do a 
    // subscription based event management.
    wol.components.add('events', function(entity) {
        var events = new Events();
        // ### entity.on (name, callback)
        // Binds callback function to an event type.
        entity.on = function(name, cb) {
            events.on(name, cb);
        };
        // ### entity.off (name, callback)
        // Removes a callback function from an event type. If no callback is provided,
        // it will clear all the subscribed events. If no event name is specified,
        // it will clear all callbacks in the event manager.
        entity.off = function(name, cb) {
            events.off(name, cb);
        };

        // ### entity.emit(data)
        // Dispatches the callback functions from the event manager..
        entity.emit = function() {
            events.emit.apply(events, arguments);
        };
    });

    // wol.Entity (Class)
    // ------------------
    return wol.Entity = wol.Class.extend({
        // ### entity.init()
        // When an entity is instantiated, we create a list of `._components` for component
        // keeping. That way we have a list of all components that are installed to our
        // entity, and will prevent overwriting of previously assigned components.
        init: function() {
            this._components = [];
            // This container is where all our visual animations and graphics will be placed.
            this.container = wol.create.container();
        },
        // ### entity.LEFT
        // A static property that lets us choose which direction a unit could face.
        LEFT: 'left',

        // ### entity.RIGHT
        // A static property that lets us choose which direction a unit could face.
        RIGHT: 'right',

        // ### entity.flip(direction)
        // Tells the entity to face a certain direction.
        flip: function(direction) {
            this.container.scaleX = direction === this.LEFT ? -1 : 1;
            //this.container.scaleX = Math.random() > 0.5 ? -1 : 1;
        },

        // ### entity.addComponent(name)
        // Adds component to the entity. This function prevents having the entity being assigned
        // with components twice.
        addComponent: function(name) {
            var component, args;
            if (this._components.indexOf(name) > -1) {
                return;
            }
            if(component = wol.components.get(name)) {
                args = Array.prototype.slice.call(arguments);
                args.splice(0, 1);
                args.splice(0, 0, this);
                component.apply(this, args);
                this._components.push(name);
            }
        }
    })

})
