require([
    'wol/wol',
    'game/main',
    'cookies',
    'wol/keys'
], function(
    wol,
    Game,
    Cookies,
    keys
){
    "use strict";

    // use for name
    var vendorName = navigator.vendor.replace(/(^\w+).+/, function (a, b) {
        return b;
    });

    /**
     * The main DOM element container for the game including the UI
     * and the game canvas.
     * @type {HTMLElement}
     */
    var el = document.getElementById('main');
    /**
     * The canvas container.
     * @type {HTMLElement}
     */
    var canvasContainer = document.getElementById('game');
    /**
     * An instance of a game.
     * @type {Game}
     */
    var game = null;

    var socket = null;
    /**
     * Player data.
     * @type {Object}
     */
    var player = {};

    var players = [];

    var tpl = {
        sub: function(string, object) {
            var str = string;
            for(var key in object) {
                str = str.replace("{{" + key + "}}", object[key]);
            }
            return str;
        },
        /**
         *
         * @param data
         * @return {*}
         */
        turnList: function(data) {
            return this.sub("<li class='avatar {{code}}'></li>", data);
        },
        /**
         *
         * @param data
         * @return {*}
         */
        actionBar: function(data) {
            return this.sub("<div class='bar'></div>", data);
        }
    };

    /**
     * Initialize the socket connection immediately.
     * Load the assets later.
     */
    function init() {
        socket = io.connect();
        // these are the initial events. The main game event
        // listeners are located in the ready() event.
        socket
            .on('player.data', setPlayerData)
            .on('game.join', joinGame)
            .on('player.add', addPlayer)
        ;
        setAuthKey();
    }

    /**
     * When the game is initialized and ready to be
     * manipulated.
     * @param g
     */
    function ready(g /** Game **/) {
        game = g;
        game.player = player;
        game.on('test', checkTurn);
        players.forEach(game.addPlayer.bind(game));
        // game events
        socket
            .on('unit.spawn', unitSpawn)
            .on('unit.turn', unitTurn)
            .on('units.turn.list', unitsTurnList)
        ;
        // initialize mouse events
        wol.dom.click(wol.$('#unit-actions .move.command'), showMoveCommand);
        wol.keys.on(wol.KeyCodes.V, showMoveCommand);

        send('ready');
    }

    /**
     *
     * @param data
     */
    function unitsTurnList(data) {
        var list = data.turnList;
        var el = wol.$('#turn-list');
        var domList = wol.$(el, 'ul');
        var unit;
        var id;
        domList.innerHTML = '';
        for (var i = 0, total = list.length; i < total; i++) {
            id = list[i];
            if (unit = game.units.get(id)) {
                domList.innerHTML += tpl.turnList({ code: unit.code });
            }
        }
        wol.dom.removeClass(el, 'hidden');
    }

    function unitTurn(data) {
        var id = data.id;
        var unit;
        /// most of these are DOM UI stuff. Don't worry :-)
        if (unit = game.units.get(id)) {
            game.activeUnit = unit;
            game.clearHexes(unit);
            unit.tileStart = unit.tile;
            unit.hexes.selected =
                game.createTiles([unit.tile], 'hex_player_selected', function(hex) {
                    game.hexContainer.addChild(hex);
                });
            // show the unit action panel
            var actionPanel = wol.$('#unit-actions');
            var healthStat = unit.stats.get('health');
            // update the health info
            wol.$(actionPanel, '.health .value').textContent =
                healthStat.value + '/' + healthStat.max;
            wol.dom.removeClass(actionPanel, 'hidden');
            // update the avatar
            var avatarElement = wol.$(actionPanel, '.avatar');
            wol.dom.removeClass(avatarElement);
            wol.dom.addClass(avatarElement, 'avatar');
            wol.dom.addClass(avatarElement, unit.code);
            // update the action bars
            var actionStat = unit.stats.get('actions');
            var actionBars = wol.$(actionPanel, '.actions .bars');
            var barWidth = 100 / actionStat.max;
            wol.dom.empty(actionBars);
            for(var i=0; i<actionStat.max; i++) {
                actionBars.innerHTML += tpl.actionBar();
                wol.dom.last(actionBars).style.width = barWidth + '%';
            }
        }
    }

    function checkTurn(unit) {
        unit.hexes.selected =
            game.createTiles([unit.tile], 'hex_player_selected', function(hex) {
                game.hexContainer.addChild(hex);
            });
    }

    function unitSpawn(data) {
        game.unitSpawn(data);
    }

    /**
     *
     * @param data
     */
    function unitEnd(data) {
        var id = data.id;
        var unit;
        if (unit = game.units.get(id)) {
            // remove all hexTiles child elements.
            wol.each(unit.hexTiles, function(hex){
                game.hexContainer.removeChild(hex);
            });
            unit.hexTiles = [];
            //game.activeUnit = null;
        }
    }

    /**
     *
     * @param topic
     * @param data
     */
    function send(topic, data) {
        console.log(arguments);
        socket.emit(topic, data);
    }

    /**
     * @param data
     */
    function addPlayer(data) {
        players.push(data);
    }

    function showMoveCommand() {
        var unit;
        if (unit = game.activeUnit) {
            game.unitRange(unit);
        }
    }

    /**
     * Update the client and tell them to start one. I didn't put a
     * condition here to prevent from re-initializing since this is
     * purely a server-side event.
     */
    function joinGame() {
        if (!game) {
            wol.init(Game, canvasContainer, 960, 640, ready);
        }
    }

    /**
     * Update the client player information
     * @param data
     */
    function setPlayerData(data) {
        player.id = data.id;
        player.name = data.name;
        player.authKey = data.authKey;
        Cookies.set('wol_id', player.authKey);
        send('game.find');
    }

    /**
     * Send the client's AuthKey based on Cookies.
     */
    function setAuthKey() {
        var authKey = Cookies.get('wol_id');
        send('auth', { authKey: authKey});
        wol.wait(1000, function() {
            send('player.set.name', { name: vendorName });
        });
    }
    init();
});