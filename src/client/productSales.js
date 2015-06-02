ProductSalesViewModel = function() {
	this.sales = mko.collectionObservable(Sales, {}, {sort: {timestamp: -1}});
	
	this.dateRange = ko.observable();
	this.store = ko.observable();
	this.user = ko.observable();
	this.paymentMethod = ko.observable();
	
	this.activated = null;
	this.activate = function() {
		if (! this.activated) {
			this.activated = true;
			ko.computed(this.activate, this); // makes subscription reactive
			return;
		}
		if (this.dateRange()) SubscriptionManager.Sales(
				this.dateRange()[0],
				this.dateRange()[1], 
				this.user(), 
				null, 
				this.store(), 
				this.paymentMethod());
	};
	
	this.productSales = ko.computed(function() {
		var productsMap = {};
		var productSales = [];
		this.sales().forEach(function(sale) {
			sale.items.forEach(function(item) {
				var t = productsMap[item.product];
				if (! t) {
					t = {"product": item.product, "qty": 0, "total": 0};
					productsMap[item.product] = t;
					productSales.push(t);
				}
				t["qty"] += item.qty;
				t["total"] += item.qty*item.price;
			});
		});
		
		return productSales;
	}.bind(this));
	
	this.filterTotal = ko.computed(function() {
		var total = 0;
		this.sales().forEach(function(sale) { total += sale.total;});
		return total;
	}.bind(this));
	
}
