
module.exports = (function() {

    function Players() {
        this.dictionary = {};
        this.list = [];
    }

    /**
     * adds a user into the collection.
     * @param player
     */
    Players.prototype.add = function (player) {
        if ((player || player.id) && this.list.indexOf(player) === -1) {
            this.list.push(player);
            this.dictionary[player.id] = player;
            this.dictionary[player.authKey] = player;
            player.on('remove', this.remove.bind(this));
        }
    };

    Players.prototype.get = function (id) {
        return this.dictionary[id];
    };

    /**
     * Remove player from the collection.
     * @param player
     */
    Players.prototype.remove = function (player) {
        console.log('attempting to remove', player.id);
        var index = this.list.indexOf(player);
        if (index > -1) {
            this.list.splice(index, 1);
            delete this.dictionary[player.id];
            delete this.dictionary[player.authKey];
            console.log('players.js : ', 'player removed ', player.id);
        } else {
            console.log('player.js :', player.id, ' is not found');
        }
    };

    Players.prototype.toJSON = function() {
        var json = [];
        var item;
        for(var i=this.list.length - 1; i > -1; i--) {
            item = this.list[i];
            json.push({
                id: item.id,
                name: item.name
            });
        }
        return json;
    };

    return Players;
})();