/**
 * Date: 9/25/12
 * Time: 9:46 AM
 */
define([
    'wol/wol'
],
function (
    wol
    ){
    "use strict";

    /**
     * This Class is responsible for storing HexTile objects
     * in each entity/unit.
     * @type {*}
     */
    var HexTileManager = wol.Class.extend({
        init: function () {
            this._list = [];
            this._dict = {};
            this.add('move');
            this.add('range');
            this.add('reach');
            this.add('selected');
            this.add('playerSide');
        },
        /**
         * Registers a hextile to the list
         * @param type
         */
        add: function (type) {
            var list = [];
            if (this._list.indexOf(type) === -1) {
                this._dict[type] = list;
                this._list.push(type);
            }
        },

        /**
         * Retrieves a hexTile to the list.
         * @param type
         * @return {*}
         */
        get: function (type) {
            return this._dict[type];
        },

        /**
         * sets the array value
         * @param type
         * @param array
         */
        set: function (type, array) {
            if(wol.isArray(array)) {
                this._dict[type] = array;
            }
            return array;
        },

        clear: function (type, cb) {
            var listType;
            for (var i = 0, _len = this._list.length; i < _len; i++) {
                listType = this._list[i];
                if (type === void 0 || type.indexOf(listType) > -1) {
                    // dispatch this list
                    if (wol.isFunction(cb)) cb(this.get(listType));
                    // clear, restart the list.
                    this._dict[listType] = [];
                }
            }
        }
    });

    wol.components.add('hextile', function(entity){
        entity.hexTiles = new HexTileManager();
    });

    return wol;
});