define([
    'wol/wol'
], function(wol) {

    "use strict";

    return wol.Collection = wol.Class.extend({
        init: function() {
            this.dictionary = {};
            this.list = [];
            this.length = 0;
        },
        add: function(item) {
            if (item.id && this.list.indexOf(item) === -1) {
                this.list.push(item);
                this.dictionary[item.id] = item;
            }
            this.length = this.list.length;
        },
        remove: function(item) {
            var index = this.list.indexOf(item);
            if (index > -1) {
                this.list.splice(index, 1);
                delete this.dictionary[item.id];
            }
            this.length = this.list.length;
        },
        get: function(id) {
            return this.dictionary[id];
        }
    });
});