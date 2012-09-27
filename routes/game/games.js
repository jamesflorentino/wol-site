module.exports = (function() {

    function Games() {
        this.dictionary = {};
        this.list = [];
        this.vacant = [];
        this.length = 0;
    }

    Games.prototype.add = function (game) {
        if (game !== undefined && this.list.indexOf(game) === -1) {
            game.on('empty', this.remove.bind(this));
            this.list.push(game);
            this.vacant.push(game.id);
            this.dictionary[game.id] = game;
        }
        this.length = this.list.length;
        return this;
    };

    Games.prototype.remove = function (game) {
        this.list.splice(this.list.indexOf(game), 1);
        this.vacant.splice(this.vacant.indexOf(game), 1);
        delete this.dictionary[game.id];
        this.length = this.list.length;
    };

    Games.prototype.available = function () {
        return this.get(this.vacant[0]);
    };

    Games.prototype.occupy = function (game, user, team) {
        if (game.players.length < game.MAX_USERS) {
            game.addPlayer(user, team);
            game.name = 'game: ' + this.list.length;
            if (game.players.length === game.MAX_USERS) {
                this.vacant.splice(this.vacant.indexOf(game.id), 1);
            }
        }
        return this;
    };

    Games.prototype.get = function(id) {
        return this.dictionary[id];
    };

    Games.prototype.toJSON = function() {
        var json = [];
        var item;
        for(var i=0; i<this.list.length; i++) {
            item = this.list[i];
            json.push(item.toJSON());
        }
        return json;
    };

    return Games;
})();