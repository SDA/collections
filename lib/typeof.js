(function(define) {
	define('typeof', [], function() {

		var types = {};
		var toString = {}.toString;
		var TYPEOF = function(obj) {
			var key;
			return obj === null ? 'null' :
				typeof obj == 'undefined' ? 'undefined' :
				obj === define ? 'global' :
				types[key = toString.call(obj)] || ( types[key] = key.match(/\s([a-zA-Z0-9]+)/)[1].toLowerCase() );
		}

		// Return the module definition.
		return TYPEOF;
	});
}(typeof define === 'function' && define.amd ? define : function(name, deps, factory) {
	// node.js
	if (typeof module !== 'undefined' && module.exports) {
		module.exports = factory(require);
	}

	// require.js
	else if (typeof require === 'function') {
		window['TYPEOF'] = factory(function(value) {
			return window[value];
		});
	}

	// web browsers
	else {
		window['TYPEOF'] = factory();
	}
}));
