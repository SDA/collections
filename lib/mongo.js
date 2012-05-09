(function() {

	var TYPEOF = require('./typeof.js');
	var uuid = require('node-uuid');

	var driver = function(options, callback) {
		var mongodb = require('mongodb');
		var db = new mongodb.Db(options.database, new mongodb.Server(options.host, options.port || mongodb.Connection.DEFAULT_PORT, {}), {});
		if (options.username && options.password) {
			db.auth(options.username, options.password);
		}

		var collections = {};
		var fetchCollection = function(name) {
			var collection = collections[name];
			if (!collection) {
				collection = new mongodb.Collection(db, name);
				collections[name] = collection;
			}
			return collection;
		}

		var sanitize = function(item) {
			if (TYPEOF(item) == 'array') {
				var items = item;
				for (var i in items) {
					items[i] = sanitize(items[i]);
				}
				return items;
			}

			if (item && item._id) {
				item.id = item._id;
				delete item._id;
			}
			return item;
		}

		db.open(function(error, client) {
			if (error) throw error;
			callback({
				save: function(collection, item, callback) {
					if (item.id) {
						fetchCollection(collection).update({'_id':item.id}, item, {safe:true}, function(err) {
							callback(err, item);
						});
					}
					else {
						item._id = uuid();
						fetchCollection(collection).insert(item, {safe:true}, function(err, insertedItems) {
							var insertedItem = insertedItems[0];
							callback(err, sanitize(insertedItem));
						});
					}
				},

				get: function(collection, id, callback) {
					fetchCollection(collection).findOne({'_id':id}, function(err, item) {
						callback(err, sanitize(item));
					});
				},

				del: function(collection, id, callback) {
					fetchCollection(collection).remove({_id:id}, function(err) {
						callback(err);
					});
				},

				find: function(collection, query, options, callback) {
					fetchCollection(collection).find(query || {}, options || {}).toArray(function(err, items) {
						callback(err, sanitize(items));
					});
				},

				close: function() {
					db.close();
				}
			});
		});
	}

	module.exports = driver;

})();
