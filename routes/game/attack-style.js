(function() {
    var AttackPattern = {
        single: function(tile) {

        }
    };

    if (typeof define == 'function' && typeof define.amd == 'object' && define.amd) {
        define(function() {
            return AttackPattern;
        });
    }
    if (typeof module == 'object' && module) {
        module.exports = AttackPattern;
    }
})();
