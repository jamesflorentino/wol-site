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
        this.length = this.list.length;
    }

};
/**
 *
 * @param index
 * @return {*}
 */
Collection.prototype.at = function(index) {
    return this.list[index];
};
/**
 *
 * @param id
 * @return {*}
 */
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
        this.length = this.list.length;
    }
};

Collection.prototype.each = function(callback) {
    for(var i=0; i<this.list.length; i++) {
        callback(this.list[i]);
    }
};

Collection.prototype.has = function (model) {
    return this.list.indexOf(model) > -1;
}

module.exports = Collection;