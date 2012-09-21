define([
    'wol/wol',
    'wol/game',
    'game/hexgrid',
    'game/textures/elements',
    'game/hex',
    'game/components/hexgrid',
    'game/components/unit',
    'game/components/stats',
    'wol/keys'

], function(
    wol,
    Game,
    HexGrid,
    elements,
    Hex,
    HexGridComponent,
    UnitComponent,
    Stats,
    Keys
    ) {

    "use strict";

    var URI_BACKGROUND = 'media/background.png';

    // Include assets to the imageQueue
    wol.resources.add(
        URI_BACKGROUND
    );

    // Include the elements sprite sheet
    wol.spritesheets.add('elements', elements);

    return Game.extend({

        hexgrid: new HexGrid(),

        background: null,

        hexContainer: wol.create.container(),

        unitContainer: wol.create.container(),

        columns: 9,

        rows: 9,

        cachedTextures: {},

        init: function() {
            // Invoke any parent requirements.
            this.parent();
            this.background = wol.create.bitmap(wol.resources.get(URI_BACKGROUND));
            this.add(this.background);
            this.add(this.hexContainer);
            this.add(this.unitContainer);
            this.hexgrid.generate(this.columns, this.rows);
            this.createStaticGridDisplay(this.hexgrid);
        },
        /**
         * Adds an entity to the display list as well as the components needed for the game.
         * @param entity
         * @return {*}
         */
        addEntity: function(entity, id, code, name) {
            // since this is a hex-grid game, we should apply a hexgrid component
            // to the entities we add into the display list.
            entity.addComponent('hexgrid');
            entity.addComponent('unit');
            entity.addComponent('stats');
            entity.metaData(id, code, name);
            entity.hide();
            this.add(entity.container, this.unitContainer);
            return this;
        },
        /**
         * Creates a static bitmap for the grid.
         * @param grid
         */
        createStaticGridDisplay: function(grid) {
            var i, _len, tile, hex, image, container, _this = this;
            //image = wol.spritesheets.extract('elements','hex_bg');
            i = 0;
            container = wol.create.container();
            this.createTiles(this.hexgrid.tiles, 'hex_bg', function(hex) {
                _this.add(hex, container);
            });
            // Cache the hexTile container.
            // We wait for a tick before we cache it. Because sometimes
            // Chrome fails to render on initial load.
            wol.wait(0, function(){
                wol.create.cache(container, wol.width, wol.height);
            });
            this.add(container, this.hexContainer);
        },
        /**
         * Returns an array of hexes as well as issue a callback whenever they're instantiated.
         * @param tiles
         * @param type
         * @param callback
         * @return {Array}
         */
        createTiles: function(tiles, type, callback) {
            var image, hex, tile, hexes;
            type || (type = 'hex_select');
            image =
                this.cachedTextures[type] ||
                    (this.cachedTextures[type] = wol.spritesheets.extract('elements', type));
            hexes = [];
            for (var i = tiles.length - 1; i >= 0; i--){
                tile = tiles[i];
                hex = wol.create.bitmap(image);
                hexes.push(hex);
                Hex.position(hex, tile);
                if (wol.isFunction(callback)) {
                    callback.call(this, hex, i);
                }
            }
            return hexes;
        },

        findNearestPath: function(start, end) {
            var openList,
                closedList,
                currentNode,
                neighbors,
                neighbor,
                scoreG,
                scoreGBest,
                i,
                _len;
            openList = [start];
            closedList = [];
            while(openList.length) {
                var lowestIndex = 0;
                for(i=0,_len = openList.length; i < _len; i++) {
                    if (openList[i].f < openList[lowestIndex].f) {
                        lowestIndex = i;
                    }
                }
                currentNode = openList[lowestIndex];
                // case END: The result has been found.
                if (currentNode.pos() === end.pos()) {
                    var current = currentNode;
                    var tiles = [];
                    while (current.parent) {
                        tiles.push(current);
                        current = current.parent;
                    }
                    return tiles.reverse();
                }
                // case DEFAULT: Move current node to the closed list.
                openList.splice(currentNode, 1);
                closedList.push(currentNode);
                // Find the best score in the neighboring tile of the hex.
                neighbors = this.hexgrid.neighbors(currentNode);
                for(i=0, _len = neighbors.length; i < _len; i++) {
                    neighbor = neighbors[i];
                    if (closedList.indexOf(neighbor) > -1) {
                        continue;
                    }
                    scoreG = currentNode.g + 1;
                    scoreGBest = false;
                    // if it's the first time to touch this tile.
                    if(openList.indexOf(neighbor) === -1) {
                        scoreGBest = true;
                        neighbor.h = this.hexgrid.euclidean(neighbor, end);
                        openList.push(neighbor);
                    }
                    else if (scoreG < neighbor.g) {
                        scoreGBest = true;
                    }
                    if (scoreGBest) {
                        neighbor.parent = currentNode;
                        neighbor.g = scoreG;
                        neighbor.f = neighbor.g + neighbor.h;
                    }
                }
            }
            return [];
        }
    });

});
