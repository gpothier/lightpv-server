Meteor.startup(function() {
	Meteor.autorun(function() {
		if (! Session.get("filter_date")) return;
		
		Meteor.subscribe("sales",
			Session.get("filter_date")[0],
			Session.get("filter_date")[1], 
			Session.get("filter_userId"), 
			Session.get("filter_clientId"), 
			Session.get("filter_storeId"), 
			Session.get("filter_paymentMethod"));
	});
});

function SalesViewModel() {
	this.sales = mko.collectionObservable(Sales, {}, {sort: {timestamp: -1}});
	
	this.filterTotal = ko.computed(function() {
		var total = 0;
		this.sales().forEach(function(sale) { total += sale.total;});
		return total;
	}.bind(this));
	
	this.showDetails = function(sale) {
		showSaleDetails(sale);
	}.bind(this);
}

Template.sales.rendered = function() {
	var view = new SalesViewModel();
	ko.applyBindings(view, $("#sales-pane")[0]);
};


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

