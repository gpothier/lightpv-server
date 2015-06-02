SalesViewModel = function() {
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
	
	
	
	this.filterTotal = ko.computed(function() {
		var total = 0;
		this.sales().forEach(function(sale) { total += sale.total;});
		return total;
	}.bind(this));
	
	this.showDetails = function(sale) {
		showSaleDetails(sale);
	}.bind(this);
}


// Show sale details
showSaleDetails = function(sale) {
	saleDetailDialogViewModel.sale(sale);
	AntiModals.overlay("saleDetail", {
		modal: true,
	});
};

function SaleDetailDialogViewModel() {
	this.sale = ko.observable();
	
	this.items = ko.computed(function() {
		if (! this.sale()) return [];
		return this.sale().items;
	}.bind(this));
	
	this.close = function() {
        AntiModals.dismissOverlay($("#sale-detail-dialog"), null, null);
	}.bind(this);
}

Meteor.startup(function() {
	saleDetailDialogViewModel = new SaleDetailDialogViewModel();
	
	Template.saleDetail.rendered = function() {
		ko.applyBindings(saleDetailDialogViewModel, $("#sale-detail-dialog")[0]);
	};
});	

