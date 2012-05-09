(function() {

	var TYPEOF = require('./typeof.js');
	var uuid = require('node-uuid');

	var driver = function(options, callback) {
		var tiny = require('tiny');

		var collections = {};
		var fetchCollection = function(name, callback) {
			var collection = collections[name];
			if (collection) {
				callback(collection);
			}
			else {
				tiny(name + '.tiny', function(err, collection) {
					collections[name] = collection;
					callback(collection);
				});
			}
		}

		var sanitize = function(item) {
			if (TYPEOF(item) == 'array') {
				var items = item;
				for (var i in items) {
					items[i] = sanitize(items[i]);
				}
				return items;
			}

			if (item._key) {
				item.id = item._key;
				delete item._key;
			}
			return item;
		}

		callback({
			save: function(collection, item, callback) {
				fetchCollection(collection, function(db) {
					if (!item.id) item.id = uuid();
					db.set(item.id, item, function(err) {
						callback(err, item);
					});
				});
			},

			get: function(collection, id, callback) {
				fetchCollection(collection, function(db) {
					db.get(id, function(err, item) {
						callback(err, sanitize(item));
					});
				});
			},

			del: function(collection, id, callback) {
				fetchCollection(collection, function(db) {
					db.remove(id, function(err) {
						callback();
					});
				});
			},

			find: function(collection, query, options, callback) {
				fetchCollection(collection, function(db) {
					var find = db.find(query || {});
					if (options.limit) find = find.limit(options.limit);
					find(function(err, items) {
						callback(err, sanitize(items));
					});
				});
			},

			close: function() {
				// Close all collections.
				for (var i in collections) {
					var collection = collections[i];
					collection.close();
				}

				// Clear the collections cache.
				collections = {};
			}
		});
	}

	module.exports = driver;

})();
