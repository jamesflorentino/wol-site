define('wol/wol', function(require, exports, module){
    "use strict";
    var Events = require('./events'),
        utils = require('./utils'),
        wait = utils.wait,
        Collection = require('./collection'),
        KeyManager = require('./keys')
    ;

    // anonymous requires
    require('../createjs/create');
    // To enable functions like .bind, .etc
    require('./browser-mixins');

    var createjs = window.createjs,
        SoundJS = createjs.SoundJS,
        PreloadJS = createjs.PreloadJS
    ;

    /**
     * The namespace for the game's core authority.
     * @type {Object}
     */
    var wol = {
        config: {
            units: {
                mirrored: {
                }
            }
        },
        KeyCodes: KeyManager.KeyCodes,
        keys: KeyManager,
        sound: {

            /**
             *
             * @param {String} id
             */
            play: function(id) {
                SoundJS.play(id);
                wol.events.emit('sound.on', id);
            },

            /**
             *
             * @param {String} id
             */
            pause: function(id) {
                SoundJS.pause(id);
            },

            /**
             * Set the volume of the sound
             * @param {Number} volume
             * @param {String} id
             */
            volume: function(volume, id) {
                SoundJS.setVolume(volume, id);
                (volume === 0
                    ? wol.events.emit('volume.off', id)
                    : wol.events.emit('volume.on', id)
                );
            }
        },

        touchEnabled: createjs.Touch.isSupported(),
        touch: {
            enable: createjs.Touch.enable, // function
            disable: createjs.Touch.disable // function
        },
        /**
         * An API for component registration which is then used to apply to entities in the
         * game.
         */
        components: {
            _dictionary: {},
            /**
             * Add a new component
             * @param name
             * @param component
             * @return {*}
             */
            add: function (name, component) {
                if (!this._dictionary[name]) {
                    this._dictionary[name] = component;
                }
                return component;
            },
            /**
             * Retrieves the component if it exists.
             * @param name
             * @return {*}
             */
            get: function (name) {
                return this._dictionary[name];
            }
        },
        dom: {
            queryAll: function(el, selector) {
                return el.querySelectorAll(selector);
            },
            query: function(el, selector) {
                return el.querySelector(selector);
            },
            hasClass: function (ele,cls) {
                return ele.className.match(new RegExp('(\\s|^)'+cls+'(\\s|$)'));
            },
            addClass: function (ele,cls) {
                if (!this.hasClass(ele,cls)) ele.className += " "+cls;
            },

            removeClass: function (ele,cls) {
                if (this.hasClass(ele,cls)) {
                    var reg = new RegExp('(\\s|^)'+cls+'(\\s|$)');
                    ele.className=ele.className.replace(reg,' ');
                }
            },
            first: function(el) {
                return el.firstElementChild;
            },
            last: function(el) {
                return el.lastElementChild;
            },
            empty: function(el) {
                return el.innerHTML = '';
            },
            click: function(el, callback) {
                el.addEventListener('click', callback);
            }
        },
        // ### wol.display
        /**
         * Used for adding display objects in the canvas which is then channeled towards the createjs.Stage instance.
         */
        display: {
            add: function (displayObject) {
                wol.stage.addChild(displayObject);
            }
        },
        /**
         * A list of methods that deals with creating instaces of createjs classes like
         * Bitmap, BitmapAnimation, Container, and caching.
         */
        create: {
            /**
             * returns a bitmap animation instance.
             * @param spritesheet
             * @return {createjs.BitmapAnimation}
             */
            animation: function (spritesheet) {
                return new createjs.BitmapAnimation(spritesheet);
            },
            /**
             * Returns a createjs.Container
             * @return {createjs.Container}
             */
            container: function () {
                return new createjs.Container();
            },
            /**
             * Creates and returns a createjs.Bitmap instance.
             * @param imageResource
             * @return {createjs.Bitmap}
             */
            bitmap: function (imageResource) {
                return new createjs.Bitmap(imageResource);
            },
            /**
             * Caches an entire container to an offscreen canvas which is
             * useful if you have a lot of static objects placed under a container.
             * @param displayObject
             * @param width
             * @param height
             * @return {*}
             */
            cache: function (displayObject, width, height) {
                wol.debug('displayObject id: ' + displayObject.id + ' CACHING', width, height);
                if (displayObject.cache) {
                    displayObject.cache(0, 0, width, height);
                    wol.debug('displayObject id: ' + displayObject.id + ' CACHED', displayObject);
                }
                return this;
            }
        },
        /**
         * Assign an event emitter.
         */
        events: new Events,
        /**
         * A list of events types.
         */
        Events: {
            /**
             * The game has finished loading the assets.
             */
            READY:'wol.ready',
            /**
             * The game is preloading.
             */
            PRELOAD_PROGRESS:'wol.preload.progress',
            /**
             * Game is starting.
             */
            GAME_START:'wol.game.start'
        },
        /**
         * A dictionary of spritesheets.
         */
        spritesheets: {
            sheets: {},
            count: 0,
            add: function (name, frameData) {
                var i, images, imageUri;
                var _this = this;
                if (!this.sheets[name]) {
                    images = frameData.images;
                    for (i = 0; i < images.length; i++) {
                        imageUri = images[i];
                        // remove invalid Urls
                        if (imageUri.indexOf('.png') < 0) {
                            images.splice(i, 1);
                        } else {
                            wol.resources.add(imageUri);
                        }
                    }
                    // If it's fresh data, add it to the ready event.
                    wol.ready(function () {
                        var imageResource, i;
                        for (i = 0; i < images.length; i++) {
                            if (imageResource = wol.resources.get(imageUri)) {
                                images[i] = imageResource;
                            }
                        }
                        _this.sheets[name] = new createjs.SpriteSheet(frameData);
                    });
                }
            },

            /**
             *
             * @param name
             * @return {*}
             */
            get: function (name) {
                return this.sheets[name];
            },
            /**
             *
             * @param name
             * @param frameName
             * @return {*}
             */
            extract: function (name, frameName) {
                var animation = wol.create.animation(this.get(name));
                animation.gotoAndStop(frameName);
                return animation;
            }
        },

        /**
         * Handles the preloading of assets.
         */
        resources: {
            manifest: [],
            loader: new PreloadJS(),

            /**
             * Include a url to the manifest before preloading starts.
             * @param urlOrUrls
             */
            add: function (urlOrUrls) {
                var list = Array.prototype.slice.call(arguments);
                for (var i = 0; i < list.length; i++) {
                    this.manifest.push(list[i]);
                }
            },

            /**
             * Return a resource
             * @param idOrUrl
             * @return {*}
             */
            get: function (idOrUrl) {
                var result = this.loader.getResult(idOrUrl);
                if (result === undefined) {
                    return null;
                }
                return this.loader.getResult(idOrUrl).result;
            },

            /**
             * Preload a resource
             * @param callback
             */
            preload: function (callback) {
                var _this = this;
                _this.loader.installPlugin(SoundJS);
                _this.loader.onProgress = (function () {
                    wol.events.emit(wol.Events.PRELOAD_PROGRESS, _this.loader.progress);
                });
                _this.loader.onComplete = callback;
                _this.loader.loadManifest(_this.manifest);
            }
        },
        tween: createjs.Tween,
        ease: createjs.Ease,
        stage: null,
        game: null,
        /**
         * Initializes a game in the wol namespace. The callback parameter
         * is invoked after the game finishes preloading the assets.
         * @param gameClass
         * @param container
         * @param width
         * @param height
         * @param callback
         */
        init: function (gameClass, container, width, height, callback) {
            wol.debug('canvas INITIALIZING');
            // create the canvas element to use for the stage
            var canvas = this.canvas = document.createElement('canvas');
            this.width = canvas.width = width;
            this.height = canvas.height = height;
            // initiate the createjs.Stage instance
            this.stage = new createjs.Stage(canvas);
            createjs.Touch.enable(this.stage);
            // insert it into the container.
            container.appendChild(canvas);
            // set the FPS setting.
            createjs.Ticker.useRAF = true;
            createjs.Ticker.setFPS(30);
            createjs.Ticker.addListener(this.update.bind(this));
            // Enable the key manager
            this.keys.init();
            this.pause();
            this.makeLoadBars();
            // set the dom events
            this.setDomEvents();
            // start preloading the assets in the manifest and assign
            // a callback.
            this.resources.preload(function () {
                wol.events
                    .emit(wol.Events.READY, wol)
                    .off(wol.Events.READY);
                // allow things to breathe before we start.
                var time = 1000;
                // time = 10;
                wait(time, function () {
                    wol.events.emit(wol.Events.GAME_START);
                    wol.play();
                    var game = new gameClass();
                    callback(game);
                })
            });
        },
        $: function (parent, selector) {
            return selector !== void 0 ? parent.querySelector(selector) : document.querySelector(parent);
        },
        // create preloader
        makeLoadBars: function () {
            var preloader = wol.$('#preloader');
            var border = wol.dom.query(preloader, '.border');
            var bar = wol.dom.query(preloader, '.bar');
            var initW = border.clientWidth;
            var _this = this;
            this.preloader.show();
            var transformProperty = '';
            var transform = bar.style[transformProperty = 'webkitTransform'] !== null
                || bar.style[transformProperty = 'mozTransform'] !== null
                || bar.style[transformProperty = 'oTransform'] !== null
                ;

            wol.events.on(wol.Events.PRELOAD_PROGRESS, function (progressRatio) {
                bar.style[transformProperty] = 'scalex(' + progressRatio + ')';
            });
            wol.events.on(wol.Events.GAME_START, function () {
                wol.dom.addClass(_this.canvas, 'active');
            });
        },
        preloader: {
            show: function() {
                var preloader = wol.$('#preloader');
                wol.dom.removeClass(preloader, 'hidden');
            },

            hide: function() {
                var preloader = wol.$('#preloader');
                wol.dom.addClass(preloader, 'hidden');
            }
        },
        ready: function (callback) {
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
            var _this = this;
            /**
            document.body.addEventListener('touchmove', function(e) {
                e.preventDefault();
            });
            /**/
            // stop the rendering when we blur out of the window.
            window.onblur = (function () {
                //_this.pause();
                //_this.paused = true;
            });
            window.onfocus = (function () {
                _this.paused = false;
            });

        },

        _dcount:0, // debug count
        debug: function () {
            //console.log(this._dcount++, Array.prototype.slice.call(arguments));
        },
        Collection: Collection,
        isFunction: utils.isFunction,
        isArray: utils.isArray,
        wait: wait,
        each: function (array, callback) {
            var i, _len;
            for (i = 0, _len = array.length; i < _len; i++) {
                callback.call(this, array[i], i);
            }
            return this;
        },
        filter: function(array, callback) {
            var result = [];
            for(var i = 0,_len = array.length; i < _len; i++) {
                if (callback(array[i])) {
                    result.push(array[i]);
                }
            }
            return result;
        }
    };

    return module.exports = wol;
});
