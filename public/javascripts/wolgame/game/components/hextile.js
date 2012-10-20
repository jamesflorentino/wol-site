define('game/components/hextile', function (require, exports, module){
    "use strict";

    var HexTileManager = require('../hextile'),
        wol = require('../../wol/wol');

    var HexTileComponent = function(entity){
        entity.hexTiles = new HexTileManager();
    };

    wol.components.add('hextile', HexTileComponent);

    return module.exports = HexTileComponent;
});