Meteor.publish("stockUpdates", function (storeId, notSummarized) {
	var query = {};
	if (storeId) query.store = storeId;
	if (notSummarized) query.summaryId = { $exists: false };
	return StockUpdates.find(query);
});
