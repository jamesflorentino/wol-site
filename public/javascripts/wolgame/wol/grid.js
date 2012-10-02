// # wol.Grid
// A collection of tile data that can be used for position and map-based games.
// * * *

//
define([

    'wol/wol',
    'wol/tile'

], function(wol, Tile) {

    "use strict";

    return wol.Grid = wol.Class.extend({
        init: function() {
            // ### grid.columns
            this.columns = 0;
            // ### grid.columns
            this.rows = 0;
            // ### grid._keys
            // _private_
            this._keys = {};
            // ### grid._tiles
            this.tiles = [];
        },
        // ### grid.generate(columns, rows)
        // Populates the grid with tile data
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
        // ### grid.get(x,y)
        // A function to get a tile reference in the grid.
        get: function(x, y) {
            if (!this._keys[x]) {
                return null;
            }
            return this._keys[x][y];
        }
    });

});
