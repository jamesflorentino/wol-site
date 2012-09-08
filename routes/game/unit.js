var utils = require('./utils');
var Stats = require('./stats');

function Unit(attributes) {
    this.id = utils.uuid();
    this.name = attributes.name;
    this.stats = new Stats(attributes.stats);
}

module.exports = Unit;