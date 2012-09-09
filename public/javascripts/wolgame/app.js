require([
    'wol/wol',
    'game/main'
], function(wol, Main){

    "use strict";

    window.onload = function() {
        var container = document.getElementById('game');
        // init (gameClass, node, width, height)
        wol.init(Main, container, 800, 550);
    };
});
