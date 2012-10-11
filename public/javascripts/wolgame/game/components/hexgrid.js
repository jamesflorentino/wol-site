define([

    'wol/wol',
    'wol/tile',
    'wol/events',
    'game/hex'

],function(wol, Tile, Events, Hex){

    "use strict";

    wol.components.add('hexgrid', function(entity) {
        // The entity is required to have an event emitter component.
        entity.addComponent('events');
        // .moveDuration
        // -------------
        // The amount of time the entity takes to get to one hex tile to another.
        entity.moveDuration = 1000;
        // .move
        // -----
        // Moves the entity to a tile. Supply with an Array, and it will automatically tween
        // between the points.
        entity.currentTile = null;
        entity.move = function(tileOrTiles) {
            var tweenObj, coord;
            // check if the argument is a tile
            if (wol.isArray(tileOrTiles)) {
                entity.currentTile.vacate();
                entity.currentTile = tileOrTiles[tileOrTiles.length-1];
                entity.currentTile.occupy(entity);
                // emit an event that tells the entity we're starting to move to a point
                entity.emit('hex.move.start');
                // initiate a tween.
                tweenObj = wol.tween.get(entity.container);
                // iterate through the array, and assign tween chaining
                wol.each(tileOrTiles, function(tile, i) {
                    var coord = Hex.coord(tile, true);
                    var prev = tileOrTiles[i-1] || entity.tile;
                    // for speeding up the animation a bit when moving the unit diagonally.
                    var time = entity.moveDuration * (prev.y != tile.y ? 0.75 : 1);
                    tweenObj = tweenObj
                        .call(function() {
                            //entity.container.scaleX = entity._currentPos.x > coord.x ? -1 : 1;
                            entity.flip(
                                entity._currentPos.x > coord.x ? 'left' : 'right'
                            );
                            entity._currentPos = coord;
                            // we assign the current active tile in the entity for reference.
                            entity.tile = tile;
                            entity.emit('unit.move.node', entity.tile);
                        })
                        .to(coord, time)
                });
                // tells the entity we're finished moving which can be used to do
                // stop a move animation.
                tweenObj = tweenObj.call(function() {
                    entity.emit('hex.move.end');
                });
            }
            else {
                // Immediately move the unit to a tile if it's not an array.
                // This is meant for initialization and/or syncing.
                // Example would be loading a game and you want to immediately place
                // the entities in their right place.
                entity.tile = tileOrTiles;
                if (entity.currentTile) entity.currentTile.vacate();
                entity.currentTile = tileOrTiles;
                entity.currentTile.occupy(entity);
                coord = Hex.coord(tileOrTiles, true);
                entity.container.x = coord.x;
                entity.container.y = coord.y;
                entity._currentPos = coord;
                entity.emit('unit.move.node', tileOrTiles);
            }
        };
    });
});
