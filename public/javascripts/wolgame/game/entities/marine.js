define('game/entities/marine', function(require, exports, module) {
    "use strict";

    var wol = require('../../wol/wol'),
        Entity = require('../../wol/entity'),
        frameData = require('../textures/marine'),
        HexGridComponent = require('../components/hexgrid')
        ;

    var sheetName = 'game.entities.marine';
    var sheetNameAlt = 'game.entities.marine2';

    // add spritesheet data to the resource manager
    wol.events.on('sheet.mirror.marine', function() {
        var mirroredFrameData = JSON.parse(JSON.stringify(frameData));
        mirroredFrameData.images = [mirroredFrameData.images[0].replace('.png','_2.png')];
        wol.spritesheets.add(sheetNameAlt, mirroredFrameData);
    });
    wol.spritesheets.add(sheetName, frameData);

    var Marine = {
        init: function(parameters) {
            this.parent();
            var _this = this;
            _this.gaugeY = -80;
            // add spriteshsetes
            this.addComponent('spritesheet', wol.spritesheets.get(parameters.altUnit ? sheetNameAlt :  sheetName));
            this.addComponent('events');
            this.addComponent('hexgrid');
            this.moveDuration = 500;

            this.sequence('move_start', 'move')
                .sequence('move_end', 'idle')
                .sequence('attack', 'idle')
                .sequence('defend_start', 'defend_hold')
                .sequence('defend_end', 'idle')
                .sequence('hit', 'defend_hold')
                .sequence('die_start', 'die_end')
            ;

            this.play('idle');
            // Keyframe animations
            this.on('hex.move.start', function(){
                //_this.play('moving_restore');
                _this.play('move_start');
            });
            // when the unit stops moving
            this.on('hex.move.end', function(){
                _this.play('move_end');
            });
            // when the unit is told to attack
            this.on('unit.attack.start', function() {
                _this.play('attack');
                var delay = 150;
                wol.tween.get(this)
                    .wait(200)
                    .call(function() {
                        _this.emit('unit.attack.hit');
                    })
                    .wait(delay)
                    .call(function() {
                        _this.emit('unit.attack.hit');
                    })
                    .wait(delay)
                    .call(function() {
                        _this.emit('unit.attack.hit');
                    })
                    .wait(delay)
                    .call(function() {
                        _this.emit('unit.attack.hit');
                    })
                    .wait(delay)
                    .call(function() {
                        _this.emit('unit.attack.end');
                    })
                ;
            });
            this.on('unit.defend.start', function() {
                _this.play('defend_start');
            });
            this.on('unit.defend.end', function() {
                _this.play('defend_end');
            });
            this.on('unit.hit', function() {
                _this.play('hit');
            });
            this.on('unit.die', function() {
                _this.play('die_start');
            });
        }
    };

    return module.exports = Entity.extend(Marine);
});