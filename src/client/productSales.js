Template.productSales.helpers({
});

function ProductSalesViewModel() {
	this.sales = mko.collectionObservable(Sales, {}, {sort: {timestamp: -1}});
	
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

Template.productSales.rendered = function() {
	var view = new ProductSalesViewModel();
	ko.applyBindings(view, $("#productsales-pane")[0]);
};

