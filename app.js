/**
 * Module dependencies.
 */

var express = require('express'),
    routes = require('./routes/index'),
    user = require('./routes/user'),
    Game = require('./routes/game/index'),
    http = require('http'),
    path = require('path'),
    stylus = require('stylus'),
    nib = require('nib'),
    app = express.createServer(express.logger()),
    io = require('socket.io').listen(app)
    ;

// the game instance of the server
var game;

app.configure(function() {
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.set('view options', { layout: false });
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(stylus.middleware({
        src: __dirname + '/public',
        compile: (function(str, path) {
            return stylus(str)
                .set('filename', path)
                .set('compress', false)
                .use(nib());
        })
    }));
    app.use(express.static(__dirname + '/public'));
});

app.configure('production', function() {
    app.get('/game', Game.route);
});

app.configure('development', function() {
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
    app.get('/game', Game.routeDev);
});

// Heroku, Y U NO support websockets in 2012?
/**/
io.configure(function () {
    io.set("transports", ["xhr-polling"]);
    //io.set('transports', ['websocket', 'flashsocket', 'xhr-polling']);
    io.set("polling duration", 10);
});
/**/

var port = process.env.VCAP_APP_PORT;
console.log('Im listening to ' + port);
app.listen(port, function() {
    console.log('WEB SERVER HAS STARTED.');
});

game = new Game(io);
// routes
app.get('/', routes.index);
app.get('/players', game.api.players);
app.get('/games', game.api.games);