var utils = require('./utils');
var events = require('events');
var util = require('util');

module.exports = (function(){
    function Game() {
        this.id = utils.uuid();
        this.players = [];
        this.logs = [];
        events.EventEmitter.call(this);
    }
    util.inherits(Game, events.EventEmitter);

    Game.prototype.MAX_USERS = 2;
    Game.prototype.addUser = function (player) {
        var _this = this;
        this.players.push(player);
        this.log('player.add', {
            id: player.id,
            name: player.name
        });
    };
    Game.prototype.log = function(name, data) {
        var message = { name: name, data: data };
        this.logs.push(message);
        this.emit('log', message);
    };
    Game.prototype.connectedPlayers = function() {
        var total = 0;
        for(var i=0; i<this.players.length; i++) {
            if (this.players[i].connected) {
                total++;
            }
        }
        return total;
    };
    return Game;
})();