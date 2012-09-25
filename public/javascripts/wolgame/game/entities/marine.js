define([

    'wol/wol',
    'wol/entity',
    'game/textures/marine',
    'game/components/hexgrid'

], function(wol, Entity, marine) {
    "use strict";

    var SHEET_NAME = 'game.entities.marine';

    // let's adjust the offset a bit
    marine.frames.regX = 30;
    marine.frames.regY = 77;

    // add spritesheet data to the resource manager
    wol.spritesheets.add(SHEET_NAME, marine);

    /**
    * Marine
    * ============================================
    * super awesome solider
    **/
    return wol.Entity.extend({

        init: function() {
            this.parent();
            var _this = this;
            // add spriteshsetes
            this.addComponent('spritesheet', wol.spritesheets.get(SHEET_NAME));
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
