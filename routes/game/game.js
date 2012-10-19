var utils = require('./utils');
var events = require('events');
var util = require('util');
var Unit = require('./unit');
var unitAttributes = require('./unit-attributes');
var Grid = require('./grid');
var Collection = require('./collection');


function Game(options) {
    this.id = utils.uuid();
    this.players = new Collection();
    this.units = new Collection();
    this.grid = new Grid();
    this.maxPlayers = 2;
    this.started = false;
    this.deadUnits = [];
    this.logs = [];
    this.teams = {}; // key-pairs for teams
    // override existing using customs
    if (typeof options === 'object' && 'maxPlayers' in options) {
        if (options.maxPlayers > 0) {
            this.maxPlayers = options.maxPlayers;
        }
    }

    this.grid.generate(this.columns, this.rows);
    events.EventEmitter.call(this);
}

util.inherits(Game, events.EventEmitter);

Game.prototype.columns = 9;
Game.prototype.rows = 9;
Game.prototype.maxCharge = 5;
/**
 * @type {Number}
 */
Game.prototype.maxTurnList = 10;
/**
 * The unit that's currently taking its turn.
 * @type {null}
 */

Game.prototype.activeUnit = null;
/**
 * The player object who won this game.
 * @type {null}
 */

Game.prototype.winner = null;
/**
 * Add the users into the list.
 * @param player
 * @return {*}
 */

Game.prototype.addPlayer = function (player, team) {
    this.players.add(player);
    this.setTeam(player, team);
    this.log('player.add', {
        id: player.id,
        name: player.name,
        index: this.players.length,
        team: this.getTeam(player)
    });
    if (this.players.length === this.maxPlayers) {
        // when we have enough users, let's start a game.
        this.log('game.start', {
            id: this.id
        });
    }
    return this;
};

/**
 * Adds a unit in the game.
 * @param unit
 */
Game.prototype.addUnit = function (unit) {
    if (unit && !this.units.has(unit)) {
        this.units.add(unit);
    }
    return this;
};

/**
 *
 * @param unit
 * @param tile
 */
Game.prototype.actUnit = function(unit, tile) {
    // reach for attack.
    console.log('// -------------- Game.actUnit');
    var reachTiles = this.grid.neighbors(unit.tile, unit.stats.get('reach').value);
    var player = this.players.get(unit.playerId);
    // check if it's within the range.
    var affectedTiles;
    var splashValue;
    var affectedUnits;
    var actions;
    var damage;
    var actionData;
    var _this = this;

    actions = unit.stats.get('actions').value;
    console.log('---------------');
    console.log('| unit attacking.... actions: ', unit.stats.get('actions'));
    console.log('---------------');
    if (reachTiles.indexOf(tile) > -1 && actions > 0) {
        damage = unit.stats.get('damage').value;
        // get affected units based on splash attribute
        splashValue = unit.stats.get('splash').value;
        // initialize an array that is covered by the unit's splash radius.
        // todo - there should at least be a ratio value for the splash damage depending on proximity.
        affectedTiles = [tile].concat(this.grid.neighbors(tile, splashValue));
        // initialize an array that will find all existing entities in the tiles.
        // provided with a special case filter that will remove anything that doesn't
        // meet the unit's targeting criteria.
        affectedUnits = this.filterUnitsInTiles(affectedTiles, function (entity) {
            return entity !== unit
                && entity.stats.get('health').value > 0
                && entity.playerId !== unit.playerId
                ;
        });
        var targetUnits = [];
        affectedUnits.forEach(function (targetUnit) {
            var targetHealthStat = targetUnit.stats.get('health');
            targetHealthStat.reduce(damage);
            targetUnits.push({
                id: targetUnit.id,
                damage: damage
            });
            if (targetUnit.stats.get('health').value === 0) {
                _this.deadUnits.push(targetUnit.id);
            }
        });
        this.log('unit.attack', {
            id: unit.id,
            targets: targetUnits
        });
        unit.stats.get('actions').reduce(1);
        this.checkActions(unit);
        this.checkWinningConditions();
    } else {
        // return an invalid move if it's invalid. This is to tell the client
        // that the current player did an invalid move.
        // todo - I probably need to change this to only send the information to the other player.
        this.log('error', {
            playerId:unit.playerId,
            unitId:unit.id,
            type:'INVALID_MOVE',
            message:player.name + ' attempted to attack ' + unit.name + '(' + unit.id + ')' + 'at ' + tile.id
        });
    }
};

Game.prototype.attack = function(unit, target) {
    var actionStat = unit.stats.get('actions');
    var damageStat = unit.stats.get('damage');
    var healthStat = target.stats.get('health');

    if (actionStat.value > 0 && healthStat.value > 0) {
        actionStat.reduce(1);
        healthStat.reduce(damageStat.value);
        console.log('|   remaining health', healthStat.value);
        this.log('unit.attack', {
            id: unit.id,
            targetId: target.id,
            damage: damageStat.value
        });
        if(healthStat.value === 0) {
            this.deadUnits.push(target.id);
            //this.checkWinningConditions();
        }
        //this.checkActions(unit);
    }
};

/**
 * Gets all units in the list of tiles.
 * @param tiles
 * @return {Array}
 */
Game.prototype.filterUnitsInTiles = function(tiles, condition) {
    var result = [];
    var tile;
    for (var i = 0; i < tiles.length; i++) {
        tile = tiles[i];
        if (tile.entity) {
            if (condition === undefined || condition(tile.entity)) {
                result.push(tile.entity);
            }
        }
    }
    return result;
};

/**
 * @param name
 * @param player
 * @return {*}
 */
Game.prototype.createUnit = function(name, player) {
    var unitAttr = unitAttributes[name];
    var unit;
    var recharge;
    if (unitAttr) {
        unit = new Unit(name, unitAttr);
        unit.playerId = player.id;
        recharge = unit.stats.get('recharge');
        recharge.setMax(this.maxCharge);
        recharge.empty();
        this.addUnit(unit);
    }
    return unit;
};

/**
 * Get all connected players.
 * @return {Number}
 */
Game.prototype.connectedPlayers = function() {
    var total = 0;
    for(var i=0; i<this.players.length; i++) {
        if (this.players.at(i).connected) {
            total++;
        }
    }
    return total;
};

/**
 * Logs the game data into an array for backlog purposes.
 * @param name
 * @param data
 * @return {*}
 */
Game.prototype.log = function(name, data) {
    var message = { name: name, data: data };
    setTimeout(function() {
        this.logs.push(message);
        this.emit('log', message);
    }.bind(this), this.__callDelay || 0);
    return this;
};

/**
 * Issue a callback of backlogs.
 * @param cb
 * @return {*}
 */
Game.prototype.backlogs = function(cb) {
    if (cb === undefined) return;
    var event;
    for (var i = 0, _len = this.logs.length; i < _len; i++) {
        event = this.logs[i];
        cb(event.name, event.data);
    }
    return this;
};
/**
 * Delays the next function call
 * @param ms
 * @return {*}
 */
Game.prototype.wait = function (ms) {
    this.__callDelay = ms;
    return this;
};

/**
 * starts the game and sends a few unit into the game.
 */
Game.prototype.start = function () {
    this.started = true;
    // test units
    var unit;
    var player;
    console.log('----------------> GAME START', this.id);
    player = this.players.at(0);
    unit = this.createUnit('marine', player);
    unit.face('right');
    this.spawnUnit(unit,
        this.grid.get(
            0,
            (Math.floor(this.rows * 0.5) + 1)
        )
    );

    unit = this.createUnit('vanguard', player);
    unit.face('right');
    this.spawnUnit(unit,
        this.grid.get(
            0,
            Math.floor(this.rows * 0.5)
        )
    );

    // 2. Spawn second player's unit
    player = this.players.at(this.players.length-1);
    unit = this.createUnit('vanguard', player);
    unit.face('left');
    this.spawnUnit(
        unit,
        this.grid.get(
            this.columns - 1,
            //1,
            (Math.floor(this.rows * 0.5) - 1)
        )
    );

    unit = this.createUnit('marine', player);
    unit.face('left');
    this.spawnUnit(
        unit,
        this.grid.get(
            this.columns - 1,
            Math.floor(this.rows * 0.5)
        )
    );
    // 3. Generate a turn list.
    this.calculateTurnList();
    // 4. Announce a unit turn.
};

/**
 * Generate a unit turn list. The iteration sequence starts
 */
Game.prototype.calculateTurnList = function() {
    this.turnList = [];
    var interval;
    var _this = this;
    var calculate = (function () {
        var unit;
        var i;
        var recharge;
        var totalUnits;
        if ((totalUnits = _this.units.length) > 1) {
            for (i = 0; i < totalUnits; i++) {
                unit = _this.units.at(i);
                unit.recharge();
                recharge = unit.stats.get('recharge');
                // if the unit reaches full charge, re-start his gauge and it
                // to the list.
                if (recharge.value === _this.maxCharge) {
                    recharge.empty();
                    _this.turnList.push(unit.id);
                    if (_this.turnList.length === _this.maxTurnList) {
                        clearInterval(interval);
                        _this.log('units.turn.list', {
                            turnList: _this.turnList
                        });
                        _this.unitTurn();
                        break;
                    }
                }
            }
        } else {
            // declare the winner if there's only one unit left.
            this.end(unit.playerId);
            clearInterval(interval);
        }
    });
    this.activeUnit = null;
    interval = setInterval(calculate, 10);
};

/**
 *
 */
Game.prototype.unitTurn = function() {
    var unit,
        id = this.turnList.shift()
        ;
    // check if there's still a queue in the turn list.
    if (unit = this.units.get(id)) {
        // skip unit if it has died already.
        if (unit.stats.get('health').value > 0) {
            unit.stats.get('actions').reset();
            this.activeUnit = unit;
            this.log('unit.turn', {
                id: unit.id
            });
        } else {
            this.unitTurn();
        }
    } else {
        this.calculateTurnList();
    }
};

/**
 * Spawns a unit in the game.
 * @param unit
 * @param tile
 */
Game.prototype.spawnUnit = function (unit, tile) {
    unit.move(tile);
    this.log('unit.spawn', {
        id: unit.id,
        code: unit.code,
        playerId: unit.playerId,
        x: unit.tile.x,
        y: unit.tile.y,
        stats: unit.stats.toJSON(),
        direction: unit.direction
    });
};

Game.prototype.toJSON = function() {
    return {
        id: this.id,
        name: this.name,
        players: this.players.toJSON()
    };
};

Game.prototype.playerReady = function(player) {
    player.ready = true;
    console.log('client ', player.id, ' is ready!');
    this.log('player.ready', {
        id: player.id
    });
    var totalPlayers = this.players.length;
    var readyCount = 0;
    if (!this.started && totalPlayers === this.maxPlayers) {
        for(var i=0; i<totalPlayers; i++) {
            if (this.players.at(i).ready) {
                readyCount++;
            }
        }
        if (readyCount === totalPlayers) {
            console.log('All clients ready to rock!');
            this.started = true;
            this.log('players.ready');
            setTimeout(this.start.bind(this), 100);
        }
    }
};

Game.prototype.userDisconnect = function() {
    this.log('game.end', {
        type: 'player.leave',
        message: 'Your opponent left the game.'
    })
};

/**
 *
 * @param unit
 * @param tile
 * @param correction - if the client needs to skip the animation.
 */
Game.prototype.move = function(unit, tile, correction) {
    var actionStat = unit.stats.get('actions');
    var actions = actionStat.value;
    var movableTiles;
    movableTiles = this.grid.neighbors(unit.tile, unit.stats.get('range').value);
    if (movableTiles.indexOf(tile) > -1) {
        if (actions > 0) {
            actionStat.setValue(actions - 1);
            unit.move(tile);
            this.log('unit.move', {
                id:unit.id,
                x:unit.tile.x,
                y:unit.tile.y,
                correction:correction
            });
            this.checkActions(unit);
        }
    } else {
        this.log('error', {
            type: 'INVALID_MOVE',
            unitId: unit.id,
            playerId: unit.playerId,
            message: ''
        });
    }
};

Game.prototype.checkWinningConditions = function() {
    var playerUnitsLeft = {};
    this.players.each(function(player) {
        playerUnitsLeft[player.id] = 0;
    });
    this.units.each(function(unit) {
        if (unit.stats.get('health').value > 0) {
            playerUnitsLeft[unit.playerId]++;
        }
    });
    var losingPlayers = [];
    var winningPlayers = [];
    this.players.each(function(player) {
        if (playerUnitsLeft[player.id] === 0) {
            losingPlayers.push(player);
        } else {
            winningPlayers.push(player);
        }
    });
    console.log('winning players', winningPlayers.length);
    console.log('losing players', losingPlayers.length);
    // todo - the condition for the this.players.length is just temporary
    if (winningPlayers.length === 1 && this.players.length > 1) {
        this.end(winningPlayers[0].id);
    }
};

Game.prototype.checkActions = function(unit) {
    if (this.activeUnit === unit) {
        console.log('remaining turns ', unit.id, unit.stats.get('actions'));
        if (unit.stats.get('actions').value === 0) {
            this.unitTurn();
        }
    }
};

Game.prototype.setTeam = function(player, team) {
    this.teams[player.id] = team;
};

Game.prototype.skip = function(unitId) {
    var unit;
    if (unit = this.units.get(unitId)) {
        if (this.activeUnit === unit) {
            this.log('unit.skip', {
                id: unit.id
            });
            this.unitTurn();
        }
    }
};

Game.prototype.end = function(playerId) {
    this.winner = this.players.get(playerId);
    this.log('game.end', {
        winnerId: this.winner.id,
        type: 'player.win'
    });
};

Game.prototype.getTeam = function(player) {
    return this.teams[player.id];
};
module.exports = Game;
