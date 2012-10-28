module.exports = {
    uuid: function(length) {
        length || (length = 24);
        var ret = "";
        while (ret < 24) {
            ret += Math.random().toString(16).substring(2);
        }
        return ret;
    },
    guid: function() {
        var S4 = function() {
            return Math.floor(
                Math.random() * 0x10000 /* 65536 */ ).toString(16);
        };
        return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
    },
    wait: function (ms, cb) {
        return setTimeout(cb, ms);
    },
    halt: function(timeout) {
        return clearTimeout(timeout);
    }
};