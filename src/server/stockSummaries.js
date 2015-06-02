Meteor.publish("stockSummaries", function (storeId) {
	var query = {};
	if (storeId) query.store = storeId;
	return StockSummaries.find(query);
});

var summariesUpdateTimeout = null;

Meteor.startup(function () {
	Meteor.setTimeout(LighTPV.updateStockSummaries, 0);
});

LighTPV.updateStockSummaries = function() {
	if (summariesUpdateTimeout) Meteor.clearTimeout(summariesUpdateTimeout);
	
	logger.info("LighTPV.updateStockSummaries");
	Stores.find().forEach(function(store) {
		LighTPV.updateStoreStockSummaries(store._id);
	});

	// Reschedule (not using setInterval to avoid overlapping calls)
	summariesUpdateTimeout = Meteor.setTimeout(LighTPV.updateStockSummaries, 86400*1000);
};

LighTPV.updateStoreStockSummaries = function(storeId) {
	// Get unprocessed sales & stock updates
	var sales = Sales.find({ store: storeId, summaryId: { $exists: false } });
	var updates = StockUpdates.find({ store: storeId, summaryId: { $exists: false } });

	logger.info("updateStoreStockSummaries", storeId, sales.count(), updates.count());
	if (sales.count() == 0 && updates.count() == 0) return;
	
	var products = {};
	var soldQtys = {};
	var previousSoldQtys = {};
	var receivedQtys = {};
	var previousReceivedQtys = {};

	// Load last summary
	var lastSummary = StockSummaries.findOne(
			{ store: storeId }, 
			{ sort: {timestamp: -1} });
	if (lastSummary) {
		lastSummary.items.forEach(function(item) {
			products[item.product] = true;
			addToMap(previousSoldQtys, item.product, item.soldQty + item.previousSoldQty);
			addToMap(previousReceivedQtys, item.product, item.receivedQty + item.previousReceivedQty);
		});
	}
	
	// Process unprocessed sales
	var saleIds = [];
	sales.forEach(function(sale) {
		saleIds.push(sale._id);
		sale.items.forEach(function(item) {
			products[item.product] = true;
			addToMap(soldQtys, item.product, item.qty);
		});
	});
	
	// Process unprocessed updates
	var updateIds = [];
	updates.forEach(function(update) {
		updateIds.push(update._id);
		update.items.forEach(function(item) {
			products[item.product] = true;
			addToMap(receivedQtys, item.product, item.qty);
		});
	});
	
	// Generate items list
	var items = [];
	for(var product in products) {
		items.push({
			product: product,
			soldQty: soldQtys[product] || 0,
			previousSoldQty: previousSoldQtys[product] || 0,
			receivedQty: receivedQtys[product] || 0,
			previousReceivedQty: previousReceivedQtys[product] || 0
		});
	}
	
	logger.info("updateStockSummaries items", storeId, items);
	
	var summary = {
			store: storeId,
			timestamp: new Date(),
			items: items
	};
	var sid = StockSummaries.insert(summary);
	Sales.update(
			{ _id: { $in: saleIds } }, 
			{ $set: { summaryId: sid } }, 
			{ multi: true });
	StockUpdates.update(
			{ _id: { $in: updateIds } }, 
			{ $set: { summaryId: sid } }, 
			{ multi: true })
}
