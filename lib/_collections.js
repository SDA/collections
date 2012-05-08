(function() {
	/*
	 * Offers a single API for working with either file system or Mongo databases.
	 */

	// This function returns true when any field contains '$regex' property,
	// so it might be inappropriate for complex queries, where not all fields
	// contain '$regex' property
	function isRegexQuery(q) {
		var val = false;
		if (q) {
			for (var i in q) {
				j = q[i];
				if (j && (j.$regex || j.$options)) {
					val = true;
					break;
				}
			}
		}
		return val;
	}

	mongoDatabase = function(params, callback) {
		// Initialize database
		console.log('Initializing MongoDB');
		var mongo = require('mongodb');
		var host = 'localhost';
		var port = mongo.Connection.DEFAULT_PORT;
		var dbName = 'test';
		if (params) {
			if (params.host != null) {
				host = params.host;
			}
			if (params.port != null) {
				port = params.port;
			}
			if (params.dbName != null) {
				dbName = params.dbName;
			}
		}
		var db = new mongo.Db(dbName, new mongo.Server(host, port, {}), {});
		if (params && params.username && params.password) {
			db.auth(username, password);
		}
		var dbClient = null;
		db.open(function (error, client) {
			if (error) {
				throw error;
			}
			dbClient = client;
//			db.authenticate('ayoudbdo', '20@Y0uDo11', function() {
//				dbClient = client;
//			});
			if (callback) {
				callback();
			}
		});

		// Utility function to easily get or create a database collection.
		var collections = {};
		function fetchCollection(name) {
			var collection = collections[name];
			if (!collection) {
				collection = new mongo.Collection(dbClient, name);
				collections[name] = collection;
			}
			return collection;
		}

		this.getAll = function(name, query, skip, limit, cb) {
			var collection = fetchCollection(name);
			if (!skip) {
				skip = 0;
			}
			if (!limit) {
				limit = 1000000;
			}
			collection.find(query, {limit: limit, skip: skip}).toArray(function(err, docs) {
				if (cb) {
					if (!err && docs) {
						for (var i = 0, l = docs.length; i < l; i++) {
							if (docs[i]._id) {
								docs[i].id = docs[i]._id;
								delete docs[i]._id;
							}
						}
					}
					cb(err, docs);
				}
			});
		}

		this.get = function(name, id, cb) {
			var collection = fetchCollection(name);
			collection.findOne({'_id': id}, function(err, item) {
				if (err) {
					console.log(err);
				}
				if (item && item._id) {
					item.id = item._id;
					delete item._id;
				}
				cb(err, item);
			});
		}

		this.put = function(name, id, data, cb) {
			var collection = fetchCollection(name);
			if (data.id) {
				delete data.id;
			}
			data._id = id;
			collection.update({'_id': id}, data, {safe:true}, function(err) {
				cb(err);
			});
		}

		this.post = function(name, data, cb) {
			if (data instanceof Array) {
				for (var i = 0, l = data.length; i < l; i++) {
					if (!data[i].id) {
						var id = uuid();
					} else {
						id = data[i].id;
					}
					if (data[i].id) {
						delete data[i].id;
					}
					data[i]._id = id;
				}
			} else {
				if (!data.id) {
					id = uuid();
				} else {
					id = data.id;
				}
				if (data.id) {
					delete data.id;
				}
				data._id = id;
			}

			var collection = fetchCollection(name);
			collection.insert(data, {safe:true}, function(err, objects) {
				if (err) {
					console.warn(err.message);
				}
				if (err && err.message.indexOf('E11000 ') !== -1) {
					// this _id was already inserted in the database
				}
				cb(err, objects);
			});
		}

		this.del = function(name, id, cb) {
			var collection = fetchCollection(name);
			collection.remove({_id: id}, function(err) {
				cb(err);
			});
		}

		return this;
	}

	tinyDatabase = function(params, callback) {
		var tiny = require('node-tiny');
		var collections = {};

		this.getAll = function(name, query, skip, limit, cb) {
			// TODO: Implement skip and limit
			var collection = collections[name];
			if (!collection) {
				tiny(name + '.tiny', function(err, collection) {
					if (err) {
						log.error(err);
					}
					collections[name] = collection;
					if (cb) {
						if (query) {
							if (isRegexQuery(query)) {
								collections[name].fetch({
									limit: 1
								}, function(doc, key) {
									for (var i in query) {
										if (doc[i] && query[i] && query[i].$regex && doc[i].toLowerCase() == query[i].$regex.toLowerCase()) {
											return true;
										} else {
											return false;
										}
									}
								}, function(err, results) {
									cb(err, results);
								});
							} else {
								collections[name].find(query)(function(err, results) {
									cb(err, results);
								});
							}
						} else {
							cb(null, collections[name]);
						}
					}
				});
			} else {
				if (cb) {
					if (query) {
						if (isRegexQuery(query)) {
							collections[name].fetch({
								limit: 1
							}, function(doc, key) {
								for (var i in query) {
									if (doc[i] && query[i] && query[i].$regex && doc[i].toLowerCase() == query[i].$regex.toLowerCase()) {
										return true;
									} else {
										return false;
									}
								}
							}, function(err, results) {
								cb(err, results);
							});
						} else {
							collections[name].find(query)(function(err, results) {
								cb(err, results);
							});
						}
					} else {
						cb(null, collections[name]);
					}
				}
			}
		}

		this.get = function(name, id, cb) {
			var collection = collections[name];
			if (!collection) {
				tiny(name + '.tiny', function(err, collection) {
					if (err) {
						log.error(err);
					}
					collections[name] = collection;
					if (cb) {
						collections[name].get(id, function(err, data) {
							cb(err, data);
						});
					}
				});
			} else {
				if (cb) {
					collections[name].get(id, function(err, data) {
						cb(err, data);
					});
				}
			}
		}

		this.put = function(name, id, data, cb) {
			var collection = collections[name];
			if (!collection) {
				tiny(name + '.tiny', function(err, collection) {
					if (err) {
						log.error(err);
					}
					collections[name] = collection;
					if (cb) {
						if (!data.id) {
							data.id = id;
						}
						collections[name].set(id, data, function(err) {
							cb(err);
						});
					}
				});
			} else {
				if (cb) {
					if (!data.id) {
						data.id = id;
					}
					collections[name].set(id, data, function(err) {
						cb(err);
					});
				}
			}
		}

		this.post = function(name, data, cb) {
			if (!data.id) {
				var id = uuid();
			} else {
				id = data.id;
			}
			var collection = collections[name];
			if (!collection) {
				tiny(name + '.tiny', function(err, collection) {
					if (err) {
						log.error(err);
					}
					collections[name] = collection;
					if (cb) {
						data.id = id;
						collections[name].set(id, data, function(err) {
							cb(err, [{id: id}]);
						});
					}
				});
			} else {
				if (cb) {
					data.id = id;
					collections[name].set(id, data, function(err) {
						cb(err, [{id: id}]);
					});
				}
			}
		}

		this.del = function(name, id, cb) {
			var collection = collections[name];
			if (!collection) {
				tiny(name + '.tiny', function(err, collection) {
					if (err) {
						log.error(err);
					}
					collections[name] = collection;
					if (cb) {
						collections[name].remove(id, function(err) {
							cb(err);
						});
					}
				});
			} else {
				if (cb) {
					collections[name].remove(id, function(err) {
						cb(err);
					});
				}
			}
		}

		// Initialize database
		if (params) {
			console.log('Initializing TinyDB');
			if (callback) {
				callback();
			}
		}
		return this;
	}

	var uuid = require('node-uuid');
	var exports = {};
	exports.tiny = tinyDatabase;
	exports.mongo = mongoDatabase;

	module.exports = exports;
})();
