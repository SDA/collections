var assert = require('assert');

var optionsfortiny = { driver: 'tiny' }
var optionsformongo = { driver: 'mongo', host: 'localhost', database: 'test' }

// Connect to the data store.
require('../lib/collections.js').connect(optionsformongo, function(collections) {

	// Add a new item to the data store. If the item doesn't contain an 'id' attribute
	// then a new item will be created in the data store and a unique ID will be assigned.
	collections.save('test', {hello: 'world'}, function(err, item) {

		// This will cause a unique value 'id' attribute to be added to the item.
		console.log('Stored new item in collection "test":');
		console.log(item);
		console.log('');

		// Update the item we just stored. If the item contains the same 'id' attribute
		// as an already existing item then the existing item will be overwritten.
		item.hello = 'cruel world';
		collections.save('test', item, function(err, updatedItem) {

			// This will cause a unique value 'id' attribute to be added to the item.
			console.log('Updated item in collection "test":');
			console.log(updatedItem);
			console.log('');

			// Retrieve the item and ensure it's got the content we'd expect.
			collections.get('test', item.id, function(err, retrievedItem) {

				// Verify contents. (ensure that IDs are compared as strings)
				assert((item.id + '') == (retrievedItem.id + ''));
				assert(item.hello == retrievedItem.hello);

				// Retrieve all items stored in the same collection. Since we only
				// added one, we'd only expect to receive one item in the collection.
				collections.find('test', {query: null, skip: 0, limit: 10}, function(err, items) {

					console.log('Found ' + items.length + ' items');
					for (var i in items) {
						var foundItem = items[i];
						console.log('[' + i + ']');
						console.log(foundItem);
					}
					console.log('');

					// Delete the item we originally added.
					collections.del('test', item.id, function(err) {
						console.log('Deleted ' + item.id);

						// Close the collections store.
						collections.close();
					});

				});

			});

		});

	});

});
