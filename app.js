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
    app = express(),
    io = require('socket.io')
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

var port = 8080;
var server = http.createServer(app).listen(port);

//io = io.listen(server);
io = io.listen(3000); // force to listen to port 3000
game = new Game(io);

// routes
app.get('/', routes.index);
app.get('/players', game.api.players);
app.get('/games', game.api.games);


io.configure(function () {
    io.enable('browser client minification');  // send minified client
    io.enable('browser client etag');          // apply etag caching logic based on version number
    io.enable('browser client gzip');          // gzip the file
    io.set('log level', 1);                    // reduce logging
    io.set('transports', [                     // enable all transports (optional if you want flashsocket)
        'websocket'
        //, 'flashsocket'
        //, 'htmlfile'
        //, 'xhr-polling'
        //, 'jsonp-polling'
    ]);
});
