require([

    'wol/wol',
    'game/main',
    'cookies'

], function(wol, Main, Cookies){

    "use strict";

    var el = document.getElementById('main');
    var gameContainer = document.getElementById('game');
    var game = null;
    var socket = null;
    var player = {};
    var currentGame = {};

    function ready(g) {
        game = g;
    }

    function connect() {
        socket = io.connect();
        socket.on('connect', setAuthKey);
        socket.on('player.data', setPlayerData);
        socket.on('game.join', joinGame);
        socket.on('game.start', startGame);

    }
    function joinGame(data) {
        currentGame.id = data.id;
    }
    function startGame(data) {
        wol.init(Main, gameContainer, 960, 640, ready);
    }
    function setPlayerData(data) {
        player.id = data.id;
        player.authKey = data.authKey;
        Cookies.set('wol_id', player.authKey);
        socket.emit('game.find');
    }
    function setAuthKey() {
        var authKey = Cookies.get('wol_id');
        socket.emit('auth', { authKey: authKey});
        socket.emit('player.set.name', { name: 'Player' });
    }

    connect();
});