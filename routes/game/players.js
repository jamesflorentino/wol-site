
module.exports = (function() {

    function Players() {
        this.dictionary = {};
        this.list = [];
    }

    /**
     * adds a user into the collection.
     * @param user
     */
    Players.prototype.add = function (user) {
        if ((user || user.id) && this.list.indexOf(user) === -1) {
            this.list.push(user);
            this.dictionary[user.id] = user;
            this.dictionary[user.authKey] = user;
        }
    };
    Players.prototype.get = function(id) {
        return this.dictionary[id];
    }

    return Players;
})();