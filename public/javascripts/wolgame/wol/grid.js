define(function(require, exports, module) {
    "use strict";

    var wol = require('./wol'),
        Tile = require('./tile'),
        Class = require('./class');

    var Grid = {
        columns: 0,
        rows: 0,
        _keys: {},
        tiles: [],
        init: function() {
            /**
             *
             * @type {Number}
             */
            this.columns = 0;
            /**
             *
             * @type {Number}
             */
            this.rows = 0;
            /**
             *
             * @type {Object}
             * @private
             */
            this._keys = {};
            /**
             *
             * @type {Array}
             */
            this.tiles = [];
        },
        /**
         * Populate the grid
         * @param {Number} columns
         * @param {Number} rows
         */
        generate: function(columns, rows) {
            var row, col, index, tile;
            this.columns = columns;
            this.rows = rows;
            index = 0;

            for(row = 0; row < rows; row++) {
                for(col = 0; col < columns; col++) {
                    tile = new Tile(col, row, index);
                    this._keys[col] || (this._keys[col] = {});
                    this._keys[col][row] = tile;
                    this.tiles.push(tile);
                    index++;
                }
            }
        },
        /**
         * Get Grid
         * @param x
         * @param y
         * @return {*}
         */
        get: function(x, y) {
            if (!this._keys[x]) {
                return null;
            }
            return this._keys[x][y];
        }
    };

    return module.exports = Class.extend(Grid);

});
