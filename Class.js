/* based on Simple JavaScript Inheritance
* By John Resig http://ejohn.org/
* MIT Licensed.
*/

var initializing = false, fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/;

// The base Class implementation (does nothing)
var Class = function(){};

// Create a new Class that inherits from this class
Class.extend = function() {
	var args = Array.prototype.slice.call(arguments);
	var name = 'Class';
	var parent = this;
	var prop = {};
	if(typeof args[0] == 'string') name = args.shift();
	if(args.length >= 2) parent = args.shift();
	prop = args.shift();

	// Copy prototype from the parent object
	var prototype = {};
	for(var name in parent.prototype) {
		prototype[name] = parent.prototype[name];
	}

	// Copy the properties over onto the new prototype
	for(var name in prop) {
		if(typeof prop[name] == "function" && fnTest.test(prop[name])) {
			// this is a function that references _super, so we have to wrap it
			// and provide it with its super function
			prototype[name] = (function(name, fn){
				return function() {
					var tmp = this._super;

					// Add a new ._super() method that is the same method
					// but on the super-class
					if(typeof parent.prototype[name] == 'undefined') {
						if(name == 'init') this._super = parent.prototype.constructor;
						else this._super = function() { throw new Error('Called _super in method without a parent'); }
					} else this._super = parent.prototype[name];

					// The method only need to be bound temporarily, so we
					// remove it when we're done executing
					var ret = fn.apply(this, arguments);				
					this._super = tmp;

					return ret;
				};
			})(name, prop[name]);
		} else {
			prototype[name] = prop[name];
		}
	}

	// The dummy class constructor
	function Class() {
		// All construction is actually done in the init method
		if(this.init) this.init.apply(this, arguments);
	}

	// Populate our constructed prototype object
	Class.prototype = prototype;

	// Enforce the constructor to be what we expect
	Class.prototype.constructor = Class;

	// And make this class extendable
	Class.extend = arguments.callee;

	return Class;
};

module.exports = Class;
