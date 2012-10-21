define(function(require, exports, module) {
    "use strict";

    var wol = require('../../wol/wol');
    var Entity = require('../../wol/entity');
    var frameData = require('../textures/vanguard');
    var HexGridComponent = require('../components/hexgrid');

    var sheetName = 'game.entities.vanguard';
    var sheetNameAlt = 'game.entities.vanguard2';

    wol.events.on('sheet.mirror.vanguard', function() {
        var mirroredFrameData = JSON.parse(JSON.stringify(frameData));
        mirroredFrameData.images = [mirroredFrameData.images[0].replace('.png','_2.png')];
        wol.spritesheets.add(sheetNameAlt, mirroredFrameData);
    });
    wol.spritesheets.add(sheetName, frameData);

    var Vanguard = {

        init: function(parameters) {
            this.parent();
            var _this = this;
            _this.gaugeY = -90;
            // add spriteshsetes
            var altUnit = parameters ? parameters.altUnit : false;
            //altUnit = true;
            this.addComponent('spritesheet', wol.spritesheets.get(altUnit ? sheetNameAlt :  sheetName));
            this.addComponent('events');
            this.addComponent('hexgrid');
            this.moveDuration = 1150;

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
                // we set the next keyframe for move, to move_end
                // because we've set that earlier in hex.move.end
                _this.sequence('move', 'move');
                _this.play('move_start');
            });
            // when the unit stops moving
            this.on('hex.move.end', function(){
                _this.sequence('move', 'move_end');
                //_this.play('move_end');
            });
            // when the unit is told to attack
            this.on('unit.attack.start', function() {
                _this.play('attack');
                var delay = 900;
                wol.tween.get(this)
                    .wait(900)
                    .call(function() {
                        _this.emit('unit.attack.hit');
                    })
                    .wait(delay)
                    .call(function() {
                        _this.emit('unit.attack.hit');
                    })
                    .wait(300)
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

    return module.exports = Entity.extend(Vanguard);
});
