define(function(require, exports, module) {

    function Stat(name, value) {
        this.name = name;
        this.value = value;
        this.max = value;
    }

    Stat.prototype = {
        /**
         *
         * @param val
         */
        setBase:function (val) {
            this.value = this.max = val;
        },

        /**
         *
         * @param val
         */
        setMax:function (val) {
            this.max = val;
        },

        /**
         *
         * @param val
         * @return {*}
         */
        setValue:function (val) {
            return this.value = Math.max(Math.min(val, this.max), 0);
        },

        /**
         *
         */
        empty:function () {
            this.value = 0;
        },

        /**
         *
         * @param val
         */
        reduce:function (val) {
            this.setValue(this.value - val);
        },

        /**
         *
         * @param val
         */
        reset:function (val) {
            this.value = this.max;
        },

        ratio:function () {
            return this.value / this.max;
        }
    };

    return Stat;
});
