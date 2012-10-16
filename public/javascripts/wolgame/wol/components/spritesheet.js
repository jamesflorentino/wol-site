define('wol/components/spritesheet', function(require, exports, module) {

    var wol = require('wol/wol');

    var SpriteSheetComponent = function(entity, spriteSheet) {

        var animation = entity._animation = wol.create.animation(spriteSheet);
        /**
         *
         * @param frame
         * @return {*}
         */
        function play(frame) {
            animation.gotoAndPlay.apply(animation, arguments);
            return entity;
        }

        /**
         *
         * @param frame
         * @return {*}
         */
        function stop(frame) {
            animation.gotoAndStop.apply(animation, arguments);
            return entity;

        }

        /**
         *
         * @param from
         * @param to
         * @return {*}
         */
        function sequence(from, to) {
            var fromA;
            if (fromA = animation.spriteSheet.getAnimation(from)) {
                fromA.next = to;
            }
            return entity;
        }

        /**
         *
         * @param direction
         */
        function flip(direction) {
            animation.scaleX = direction === 'left' ? -1 : 1;
        }

        animation.mouseEnabled = false;
        entity.container.addChild(animation);
        entity.flip = flip;
        entity.play = play;
        entity.stop = stop;
        entity.sequence = sequence;
    };

    return module.exports = SpriteSheetComponent;
});