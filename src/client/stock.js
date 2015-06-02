StockViewModel = function() {
	this.summaries = mko.collectionObservable(StockSummaries, {}, {sort: {timestamp: -1}});
	this.sales = mko.collectionObservable(Sales);
	this.updates = mko.collectionObservable(StockUpdates);
	
	this.store = ko.observable();
	
	this.activated = null;
	this.activate = function() {
		if (! this.activated) {
			this.activated = true;
			ko.computed(this.activate, this); // makes subscription reactive
			return;
		}
		SubscriptionManager.Sales(null, null, null, null, this.store(), null);
		SubscriptionManager.StockSummaries(this.store());
		SubscriptionManager.StockUpdates(this.store());
	};
	
	this.productStock = ko.computed(function() {
		var products = {};		
		
		// Account immediate (ie. non-summarized) sales and stock updates
		var soldQtys = {};
		var receivedQtys = {};
		
		this.sales().forEach(function(sale) {
			sale.items.forEach(function(item) {
				products[item.product] = true;
				addToMap(soldQtys, item.product, item.qty);
			});
		});
		
		this.updates().forEach(function(update) {
			update.items.forEach(function(item) {
				products[item.product] = true;
				addToMap(receivedQtys, item.product, item.qty);
			});
		});

		var summaries = this.summaries();
		
		var summary = summaries.length > 0 ? summaries[0] : null; // This is the last summary
		if (summary) summary.items.forEach(function(item) {
			products[item.product] = true;
			addToMap(soldQtys, item.product, item.soldQty + item.previousSoldQty);
			addToMap(receivedQtys, item.product, item.receivedQty + item.previousReceivedQty);
		});
		
		var result = [];
		for(var product in products) {
			result.push({
				product: product,
				soldQty: soldQtys[product],
				receivedQty: receivedQtys[product]
			});		
		}
		
		return result;
	}.bind(this));
	
}
