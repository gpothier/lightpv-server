Migrations.add({
	version: 1,
	name: "Create initial StockUpdate to set stock at 0 for all products",
	up: function() {
		Stores.find().forEach(function(store) {
			var lastSummary = StockSummaries.findOne(
					{ store: store._id }, 
					{ sort: {timestamp: -1} });
			
			var items = [];
			
			lastSummary.items.forEach(function(item) {
				var sold = item.soldQty + item.previousSoldQty;
				var received = item.receivedQty + item.previousReceivedQty;
				var stock = received-sold;
				items.push({
					product: item.product,
					qty: -stock
				});
			});
			
			var ts = new Date();
			
			StockUpdates.insert({
				store: store._id,
				client: null,
				user: null,
				timestamp: ts,
				serverTimestamp: ts,
				items: items
			});
		});
	},
});
