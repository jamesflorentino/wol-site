/**
 * Module dependencies.
 */

var express = require('express'),
    routes = require('./routes/index'),
    user = require('./routes/user'),
    game = require('./routes/game/index'),
    http = require('http'),
    path = require('path'),
    stylus = require('stylus'),
    nib = require('nib')
    ;

var app = express();

app.configure(function() {
    app.set('port', process.env.PORT || 3000);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.cookieParser('your secret here'));
    app.use(express.session());
    app.use(app.router);
    app.use(stylus.middleware({
        src: __dirname + '/public',
        compile: function(str, path) {
            return stylus(str)
                .set('filename', path)
                .set('compress', false)
                .use(nib());
        }
    }));
    app.use(express.static(path.join(__dirname, 'public')));
    app.get('/', routes.index);
    app.get('/users', user.list);
});

app.configure('production', function() {
    //app.get('/game', game.route);
})

app.configure('development', function() {
    app.use(express.errorHandler());
    app.get('/game', game.routeDev);
});

var server = http.createServer(app).listen(app.get('port'));

var io = require('socket.io').listen(server);

/**
 * Game logic mixin.
 * @type {*}
 */
var game = game(io);

