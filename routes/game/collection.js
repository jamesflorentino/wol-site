var Collection = function() {

    function Collection() {
        this.dictionary = {};
        this.list = [];
    }
    /**
     * adds a user into the collection.
     * @param model
     */
    Collection.prototype.add = function (model) {
        if ((model || model.id) && this.list.indexOf(model) === -1) {
            this.list.push(model);
            this.dictionary[model.id] = model;
            model.on('remove', this.remove.bind(this));
        }
    };

    Collection.prototype.get = function (id) {
        return this.dictionary[id];
    };

    /**
     * Remove player from the collection.
     * @param model
     */
    Collection.prototype.remove = function (model) {
        var index = this.list.indexOf(model);
        if (index > -1) {
            this.list.splice(index, 1);
            delete this.dictionary[model.id];
        }
    };

    return Collection;
};

module.exports = Collection();