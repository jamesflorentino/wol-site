define([

    'wol/wol',
    'wol/entity',
    'game/textures/marine',
    'game/components/hexgrid'

], function(wol, Entity, frameData, hexgrid) {
    "use strict";

    var sheetName = 'game.entities.marine';
    var sheetNameAlt = 'game.entities.marine2';

    // let's adjust the offset a bit
    frameData.frames.regX = 30;
    frameData.frames.regY = 77;

    // add spritesheet data to the resource manager
    wol.events.on('sheet.mirror.marine', function() {
        var mirroredFrameData = JSON.parse(JSON.stringify(frameData));
        mirroredFrameData.images = [mirroredFrameData.images[0].replace('.png','_2.png')];
        wol.spritesheets.add(sheetNameAlt, mirroredFrameData);
    });
    wol.spritesheets.add(sheetName, frameData);


    /**
    * Marine
    * ============================================
    * super awesome solider
    **/
    return wol.Entity.extend({

        init: function(parameters) {
            this.parent();
            var _this = this;
            // add spriteshsetes
            console.log('alternate', parameters.altUnit);
            this.addComponent('spritesheet', wol.spritesheets.get(parameters.altUnit ? sheetNameAlt :  sheetName));
            this.addComponent('events');
            this.addComponent('hexgrid');
            this.moveDuration = 500;
            // animation sequence
            this.sequence('moveStart', 'move')
                .sequence('moveEnd', 'idle')
                .sequence('attack', 'idle')
                .sequence('defendStart', 'defendHold')
                .sequence('defendEnd', 'idle')
                .sequence('hit', 'defendHold')
                .sequence('dieStart', 'dieEnd')
                ;

            this._animation.onAnimationEnd = (function(_animation, name) {
                if (name === 'attack') {
                   // _this.emit('unit.attack.end');
                }
            });
            // start with an animation
            this.play('idle');
            // Keyframe animations
            this.on('hex.move.start', function(){
                _this.play('moveStart');
            });
            // when the unit stops moving
            this.on('hex.move.end', function(){
                _this.play('moveEnd');
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
                _this.play('defendStart');
            });
            this.on('unit.defend.end', function() {
                _this.play('defendEnd');
            });
            this.on('unit.hit', function() {
                _this.play('hit');
            });
            this.on('unit.die', function() {
                _this.play('dieStart');
            });
        }
    });
});
