(function() {

	var mongo = require('./mongo.js');
	var tiny = require('./tiny.js');

	var drivers = {
		'mongo': mongo,
		'tiny': tiny
	}

	var connect = function(options, callback) {
		if (options && options.driver && drivers[options.driver]) {
			var driver = drivers[options.driver];
			return driver(options, callback);
		}
		throw 'Invalid arguments';
	}

	module.exports = {
		connect: connect
	}

})();
