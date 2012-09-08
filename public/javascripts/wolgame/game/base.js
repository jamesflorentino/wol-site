define([

    'wol/wol',
    'wol/game',
    'game/hexgrid',
    'game/textures/elements',
    'game/hex',
    'game/components/hexgrid',
    'wol/keys',
    'game/components/unit'

], function(wol, Game, HexGrid, elements, Hex, HexGridComponent, Keys, UnitComponent) {

    "use strict";

    var URI_BACKGROUND = 'media/background.png';
    var URI_TERRAIN = 'media/terrain.png';

    // Include assets to the imageQueue
    wol.resources.add(
        URI_BACKGROUND,
        URI_TERRAIN
    );

    // Include the elements sprite sheet
    wol.spritesheets.add('elements', elements);

    return Game.extend({

        hexgrid: new HexGrid(),

        background: null,

        terrain: null,

        hexContainer: wol.create.container(),

        unitContainer: wol.create.container(),

        init: function() {
            // Invoke any parent requirements.
            this.parent();
            this.background = wol.create.bitmap(wol.resources.get(URI_BACKGROUND));
            this.terrain = wol.create.bitmap(wol.resources.get(URI_TERRAIN));
            this.add(this.background);
            this.add(this.terrain);
            this.add(this.hexContainer);
            this.add(this.unitContainer);
            this.hexgrid.generate(8,8);
            this.createStaticGridDisplay(this.hexgrid);
            this.terrain.y = this.hexContainer.y = this.unitContainer.y = 60;
        },

        addEntity: function(entity) {
            // since this is a hex-grid game, we should apply a hexgrid component
            // to the entities we add into the display list.
            entity.addComponent('hexgrid');
            entity.addComponent('unit');
            entity.hide();
            this.add(entity.container, this.unitContainer);
            return this;
        },

        createStaticGridDisplay: function(grid) {
            var i, _len, tile, hex, image, container, _this = this;
            image = wol.spritesheets.extract('elements','hex_bg');
            i = 0;
            container = wol.create.container();
            this.showTiles(this.hexgrid.tiles, 'hex_bg', function(hex) {
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

        showTiles: function(tiles, type, callback) {
            var image, hex, tile, hexes;
            type || (type = 'hex_select');
            image = wol.spritesheets.extract('elements', type);
            hexes = [];
            for (var i = tiles.length - 1; i >= 0; i--){
                tile = tiles[i];
                hex = wol.create.bitmap(image);
                Hex.position(hex, tile);
                if (wol.isFunction(callback)) {
                    callback.call(this, hex, i);
                }
            }
            return hexes;
        }
    });

});
