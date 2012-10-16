define('game/base', function(require) {
    "use strict";
    var wol = require('wol/wol')
    ,   Game = require('wol/game')
    ,   HexGrid = require('game/hexgrid')
    ,   elements = require('game/textures/elements')
    ,   Hex = require('game/hex')
    ,   HexGridComponent = require('game/components/hexgrid')
    ,   HexTileComponent = require('game/components/hextile')
    ,   UnitComponent = require('game/components/unit')
    ,   StatComponent = require('game/components/stats')
    ,   KeyboardComponent = require('wol/keys')
    ;

    var URI_BACKGROUND = 'media/background.png';

    // Include assets to the imageQueue
    wol.resources.add(URI_BACKGROUND);

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
         *
         * @param entity
         * @param id
         * @param code
         * @param name
         * @param playerId
         * @return {*}
         */
        addEntity: function(entity, id, code, name, playerId) {
            // since this is a hex-grid game, we should apply a hexgrid component
            // to the entities we add into the display list.
            entity.addComponent('hexgrid');
            entity.addComponent('unit');
            entity.addComponent('hextile');
            entity.metaData(id, code, name, playerId);
            entity.hide();
            this.add(entity.container, this.unitContainer);
            return this;
        },
        /**
         * Creates a static bitmap for the grid.
         * @param grid
         */
        createStaticGridDisplay: function(grid) {
            var i, container, _this = this;
            container = wol.create.container();
            /**/
            this.createTiles(this.hexgrid.tiles, 'hex_bg', function(hex) {
                _this.add(hex, container);
            });
            /**/
            // Cache the hexTile container.
            // We wait for a tick before we cache it. Because sometimes
            // Chrome fails to render on initial load.
            wol.create.cache(container, wol.width, wol.height);
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
            var hex, tile, hexes;
            type || (type = 'hex_select');
            hexes = [];
            for (var i = tiles.length - 1; i >= 0; i--){
                tile = tiles[i];
                hex = this.getTexture(type);
                hexes.push(hex);
                Hex.position(hex, tile);
                if (wol.isFunction(callback)) {
                    callback.call(this, hex, i);
                }

            }
            return hexes;
        },

        getTexture: function(name) {
            return wol.spritesheets.extract('elements', name);
        },

        getTextureSize: function(texture) {
            var spriteSheet = texture.spriteSheet;
            var frameIndex = spriteSheet.getAnimation(texture.currentAnimation).frames[0][0];
            var assetData = spriteSheet.getFrame(frameIndex);
            return {
                width: assetData.rect.width,
                height: assetData.rect.height
            };
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
                    var parent;
                    var tiles = [];
                    while (current.parent) {
                        tiles.push(current);
                        parent = current.parent; // capture the parent element.
                        current.parent = null; // clear the tile's parent
                        current = parent; // move to the next parent
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
                    if (closedList.indexOf(neighbor) > -1 || neighbor.entity) {
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
