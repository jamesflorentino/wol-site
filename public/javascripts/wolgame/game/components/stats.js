define([

    'wol/wol',
    'game/stats'

], function (wol, Stats) {

    "use strict";

    wol.components.add('stats', function(entity) {
        entity.stats = new Stats();
    });
});