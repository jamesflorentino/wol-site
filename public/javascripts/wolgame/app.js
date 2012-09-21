require([
    'wol/wol',
    'game/main',
    'cookies'
], function(
    wol,
    Game,
    Cookies
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
            .on('units.turn.list', unitsTurnList)
        ;
        setAuthKey();

    }

    /**
     *
     * @param data
     */
    function unitsTurnList(data) {

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

    /**
     * When the game is initialized and ready to be
     * manipulated.
     * @param g
     */
    function ready(g /** Game **/) {
        game = g;
        game.player = player;
        players.forEach(game.addPlayer.bind(game));
        // game events
        socket
            .on('unit.spawn', game.unitSpawn.bind(game))
        ;
        send('ready');
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
        Cookies.set('wol_id', player.authKey);
        player.id = data.id;
        player.name = data.name;
        player.authKey = data.authKey;
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
