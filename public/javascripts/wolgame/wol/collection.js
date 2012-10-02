(function() {

    var Module = (function() {

        function Collection() {
            this.dictionary = {};
            this.list = [];
            this.length = 0;
        }
        /**
         * adds a user into the collection.
         * @param model
         */
        Collection.prototype = {
            add: function (model) {
                if ((model || model.id) && this.list.indexOf(model) === -1) {
                    this.list.push(model);
                    this.dictionary[model.id] = model;
                    if (typeof model.on === 'function') {
                        model.on('remove', this.remove.bind(this));
                    }
                    this.length = this.list.length;
                }
            },
            /**
             *
             * @param index
             * @return {*}
             */
            at: function(index) {
                return this.list[index];
            },
            /**
             *
             * @param id
             * @return {*}
             */
            get: function (id) {
                return this.dictionary[id];
            },

            /**
             * Remove player from the collection.
             * @param model
             */
            remove : function (model) {
                var index = this.list.indexOf(model);
                if (index > -1) {
                    this.list.splice(index, 1);
                    delete this.dictionary[model.id];
                    this.length = this.list.length;
                }
            },

            each : function(callback) {
                for(var i=0; i<this.list.length; i++) {
                    callback(this.list[i], i);
                }
            },

            has : function (model) {
                return this.list.indexOf(model) > -1;
            },

            sort: function (sortingAlgorithm) {
                this.list.sort(sortingAlgorithm);
            }
        };
        return Collection;
    })();

    // For AMD libraries like RequireJS.
    if (typeof define == 'function' && typeof define.amd == 'object' && define.amd) {
        define(function() {
            return Module;
        });
    }
    // For Node.js and Ringo.js
    if (typeof module == 'object' && module) {
        module.exports = Module;
    }
})();