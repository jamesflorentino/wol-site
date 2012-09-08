define([

    'createjs/create',
    'wol/events',
    'wol/utils'

], function(createjs, Events) {
    "use strict";

    var createjs, wol, wait;

    // Shim for function binding.
    if (!Function.prototype.bind) {
        Function.prototype.bind = function(oThis) {
            if (typeof this !== "function") {
                // closest thing possible to the ECMAScript 5 internal IsCallable function
                throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
            }
            var aArgs = Array.prototype.slice.call(arguments, 1),
                fToBind = this,
                fNOP = function() {},
                fBound = function() {
                    return fToBind.apply(this instanceof fNOP && oThis ? this : oThis, aArgs.concat(Array.prototype.slice.call(arguments)));
                };
            fNOP.prototype = this.prototype;
            fBound.prototype = new fNOP();
            return fBound;
        };
    }

    // ### wait
    // Shortcut for setTimeout
    wait = function (ms, cb) {
        return setTimeout(cb, ms);
    }


    // ### createjs
    // The rendering, preloading, and tween engine.
    createjs = window.createjs;

    // # wol
    // This namespace (and singleton) will be the central authority of the game.
    wol = {
        // ### wol.components
        // An API for component registration which is then used to apply to entities in the
        // game.
        components: {
            // #### wol.components._dictionary
            _dictionary: {},
            // #### wol.components.add(name, function)
            add: function(name, component) {
                if(!this._dictionary[name]) {
                    this._dictionary[name] = component;
                }
                return this;;w
            },
            // #### wol.component.get(name)
            // Retrieves the component if it exists.
            get: function(name) {
                return this._dictionary[name];
            }
        },
        // ### wol.display
        // Used for adding display objects in the canvas which is then channeled
        // towards the createjs.Stage instance.
        display: {
            // #### wol.display.add(displayObject)
            add: function(displayObject) {
                wol.stage.addChild(displayObject);
            }
        },
        // ### wol.create
        // A list of methods that deals with creating instaces of createjs classes like
        // Bitmap, BitmapAnimation, Container, and caching.
        create: {
            // #### wol.create.animation(spritesheet)
            // returns a bitmap animation instance.
            animation: function (spritesheet) {
                var animation = new createjs.BitmapAnimation(spritesheet);
                return animation;
            },
            // #### wol.create.container()
            // returns a createjs.Container
            container: function() {
                var container = new createjs.Container();
                return container;
            },
            // #### wol.create.bitmap(imageElement)
            // returns a createjs.Bitmap instance
            bitmap: function(imageResource) {
                var bitmap = new createjs.Bitmap(imageResource);
                return bitmap;
            },
            // #### wol.create.cache(displayObject, width, height)
            // Caches an entire container to an offscreen canvas which is
            // useful if you have a lot of static objects placed under a container.
            cache: function(displayObject, width, height) {
                wol.debug('displayObject id: ' + displayObject.id + ' CACHING', width, height);
                if (displayObject.cache) {
                    displayObject.cache(0, 0, width, height);
                    wol.debug('displayObject id: ' + displayObject.id + ' CACHED', displayObject);
                }
                return this;
            }
        },

        // ### wol.events
        // For easy event management.
        events: new Events(),
        // ### wol.Events
        // This property contains a list of events for this namespace.
        Events: {
            // #### wol.Events.READY
            // The event when the game finishes preloading assets.
            READY: 'wol.ready',
            // #### wol.Events.PRELOAD_PROGRESS
            PRELOAD_PROGRESS: 'wol.preload.progress',
            // #### wol.Events.GAME_START
            GAME_START: 'wol.game.start'
        },

        spritesheets: {
            sheets: {},
            images: {},
            add: function(name, frameData) {
                var i, images, imageUri;
                if (this.sheets[name]) {
                    return;
                }
                images = frameData.images;
                for (i=0; i<images.length; i++) {
                    imageUri = images[i];
                    // remove invalid Urls
                    if (imageUri.indexOf('.png') < 0) {
                        images.splice(i,1);
                    } else {
                        wol.resources.add(imageUri);
                    }
                }
                // If it's fresh data, add it to the ready event.
                wol.ready(function() {
                    var imageResource, i;
                    for (i=0; i<images.length; i++) {
                        if (imageResource = wol.resources.get(imageUri)) {
                            images[i] = imageResource;
                        }
                    }
                    this.sheets[name] = new createjs.SpriteSheet(frameData);
                }.bind(this));
                return this;
            },
            get: function (name) {
                return this.sheets[name];
            },
            extract: function (name, frameName) {
                var image;
                var id = name + "." + frameName; // e.g. elements.hex_bg
                image = this.images[id];
                // check if this doesn't exist yet
                if (image === undefined) {
                    // create a new instance of the image.
                    image = createjs.SpriteSheetUtils.extractFrame(this.get(name), frameName);
                    // add it to the dictionary.
                    this.images[id] = image;
                }
                return image;
            }
        },
        resources: {
            manifest: [],
            loader: new createjs.PreloadJS(),
            add: function (urlOrUrls) {
                var list = Array.prototype.slice.call(arguments);
                for(var i = 0; i < list.length; i++) {
                    this.manifest.push(list[i]);
                }
            },
            get: function (idOrUrl) {
                var result = this.loader.getResult(idOrUrl);
                if (result === undefined) {
                    return;
                }
                return this.loader.getResult(idOrUrl).result;
            },
            preload: function (callback) {
                this.loader.onProgress = function() {
                    wol.events.emit(wol.Events.PRELOAD_PROGRESS, this.loader.progress);
                }.bind(this);
                this.loader.onComplete = callback;
                this.loader.loadManifest(this.manifest);
            }
        },

        tween: createjs.Tween,
        ease: createjs.Ease,
        stage: null,
        game: null,
        init: function(gameClass, container, width, height, fps) {
            wol.debug('canvas INITIALIZING');
            // create the canvas element to use for the stage
            var canvas = document.createElement('canvas');
            this.width = canvas.width = width;
            this.height = canvas.height = height;
            // insert it into the ndoe container.
            container.appendChild(canvas);
            // initiate the createjs.Stage instance
            this.stage = new createjs.Stage(canvas);
            this.canvas = canvas;
            // set the FPS setting.
            createjs.Ticker.useRAF = true;
            createjs.Ticker.setFPS(30);
            createjs.Ticker.addListener(this.update.bind(this));
            this.pause();
            this.makeLoadBars();
            // set the dom events
            this.setDomEvents();
            // start preloading the assets in the manifest and assign
            // a callback.
            wol.debug('preload START');
            this.resources.preload(function() {
                wol.debug('preload FINISHED');
                wol.events
                    .emit(wol.Events.READY, wol)
                    .off(wol.Events.READY);
                // allow things to happen before we start.
                wait(1000, function(){
                    wol.events.emit(wol.Events.GAME_START);
                    wol.play();
                    new gameClass();
                })
            });
        },
        $: function(selector){
            return document.querySelector(selector);
        },
        // create preloader
        makeLoadBars: function(){
            var bar, border, initW, preloader;
            preloader= wol.$('#ui .preloader');
            border = wol.$('#ui .preloader .border');
            bar = wol.$('#ui .preloader .bar');
            initW = border.clientWidth;
            wol.events.on(wol.Events.PRELOAD_PROGRESS, function(perc){
                bar.style.width = (initW * perc) + 'px';
            });
            wol.events.on(wol.Events.GAME_START, function(perc){
                preloader.style.display = 'none';
            });
        },
        ready: function(callback) {
            wol.events.on(wol.Events.READY, callback);
        },
        update: function () {
            this.stage.update();
        },
        pause: function () {
            createjs.Ticker.setPaused(true);
            wol.debug('game PAUSED');
            return this;
        },
        play: function () {
            createjs.Ticker.setPaused(false);
            wol.debug('game RESUMED');
            return this;
        },
        setDomEvents: function () {
            // stop the rendering when we blur out of the window.
            window.onblur = function() {
                this.pause();
                this.paused = true;
            }.bind(this);
            window.onfocus = function() {
                this.paused = false;
            }.bind(this);
        },

        _dcount: 0, // debug count
        debug: function() {
            return;
            console.log( this._dcount++, Array.prototype.slice.call(arguments) );
        },

        isFunction: isFunction,
        isArray: isArray,
        wait: wait,
        each: function (array, callback) {
            var i, _len;
            for (i=0, _len = array.length; i < _len; i++) {
                callback.call(this, array[i], i);
            }
            return this;
        }

    };

    /* Simple JavaScript Inheritance
     * By John Resig http://ejohn.org/
     * MIT Licensed.
     * Note by @jamesflorentino: I changed ._super() to .parent() for syntactic comprehension.
     */
    (function() {
        var initializing = false,
            fnTest = /xyz/.test(function() {
                xyz;
            }) ? /\bparent\b/ : /.*/;
        // The base Class implementation (does nothing)
        wol.Class = function() {};
        // Create a new Class that inherits from this class
        wol.Class.extend = function(prop) {
            var parent = this.prototype;
            // Instantiate a base class (but only create the instance,
            // don't run the init constructor)
            initializing = true;
            var prototype = new this();
            initializing = false;
            // Copy the properties over onto the new prototype
            for (var name in prop) {
                // Check if we're overwriting an existing function
                prototype[name] = typeof prop[name] == "function" && typeof parent[name] == "function" && fnTest.test(prop[name]) ? (function(name, fn) {
                    return function() {
                        var tmp = this.parent;
                        // Add a new .parent() method that is the same method
                        // but on the super-class
                        this.parent = parent[name];
                        // The method only need to be bound temporarily, so we
                        // remove it when we're done executing
                        var ret = fn.apply(this, arguments);
                        this.parent = tmp;
                        return ret;
                    };
                })(name, prop[name]) : prop[name];
            }
            // The dummy class constructor
            function Class() {
                // All construction is actually done in the init method
                if (!initializing && this.init) this.init.apply(this, arguments);
            }
            // Populate our constructed prototype object
            Class.prototype = prototype;
            // Enforce the constructor to be what we expect
            Class.prototype.constructor = Class;
            // And make this class extendable
            Class.extend = wol.Class.extend;
            return Class;
        };
    })();

    return wol;

})
