(function() {

    var Collection = (function() {

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
                    model.on('remove', this.remove.bind(this));
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
                    callback(this.list[i]);
                }
            },

            has : function (model) {
                return this.list.indexOf(model) > -1;
            },

            toJSON: function() {
                var list = [];
                for(var i= 0, _len = this.list.length; i<_len; i++) {
                    list.push({
                        id: this.list[i].id,
                        name: this.list[i].name
                    });
                }
                return list;
            }
        };
        return Collection;
    })();

    // For AMD libraries like RequireJS.
    if (typeof define == 'function' && typeof define.amd == 'object' && define.amd) {
        define(function() {
            return Collection;
        });
    }
    // For Node.js and Ringo.js
    if (typeof module == 'object' && module) {
        module.exports = Collection;
    }
})();