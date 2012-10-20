/* Simple JavaScript Inheritance
 * By John Resig http://ejohn.org/
 * MIT Licensed.
 * Note by @jamesflorentino: I changed ._super() to .parent() for syntactic comprehension.
 */
define(function(require, exports, module) {
    var initializing = false,
        fnTest = /xyz/.test(function() {
            xyz;
        }) ? /\bparent\b/ : /.*/;
    // The base Class implementation (does nothing)
    var Class = function() {};
    // Create a new Class that inherits from this class
    Class.extend = function(prop) {
        var parent = this.prototype;
        // Instantiate a base class (but only create the instance,
        // don't run the init constructor)
        initializing = true;
        var prototype = new this();
        initializing = false;
        // Copy the properties over onto the new prototype
        for (var name in prop) {
            // Check if we're overwriting an existing function
            prototype[name] = typeof prop[name] == "function" && typeof parent[name] == "function" && fnTest.test(prop[name]) ? (function(name, fn) {
                return function() {
                    var tmp = this.parent;
                    // Add a new .parent() method that is the same method
                    // but on the super-class
                    this.parent = parent[name];
                    // The method only need to be bound temporarily, so we
                    // remove it when we're done executing
                    var ret = fn.apply(this, arguments);
                    this.parent = tmp;
                    return ret;
                };
            })(name, prop[name]) : prop[name];
        }
        // The dummy class constructor
        function Class() {
            // All construction is actually done in the init method
            if (!initializing && this.init) this.init.apply(this, arguments);
        }
        // Populate our constructed prototype object
        Class.prototype = prototype;
        // Enforce the constructor to be what we expect
        Class.prototype.constructor = Class;
        // And make this class extendable
        Class.extend = this.extend;
        return Class;
    };

    return module.exports = Class;
});