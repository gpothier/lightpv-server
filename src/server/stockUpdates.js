Meteor.publish("stockUpdates", function (storeId) {
	var query = {};
	if (storeId) query.store = storeId;
	return StockUpdates.find(query);
});
