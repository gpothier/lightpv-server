Meteor.startup(function() {
	Meteor.autorun(function() {
		var since = null;
		var until = null;
		
		var dateRange = Session.get("salesfilter_dateRange");
		if (dateRange) {
			if (dateRange.value == "today") {
				since = new Date();
				since.setHours(0, 0, 0, 0);
				until = new Date(since);
				until.setHours(23, 59, 59, 999);
			} else if (dateRange.value == "thisMonth") {
				since = new Date();
				since.setHours(0, 0, 0, 0);
				since.setDate(1);
				until = new Date(since);
				until.setMonth(until.getMonth()+1);
				until.setDate(0);
				until.setHours(23, 59, 59, 999);
			}
			
			console.log("Since: "+since+", until: "+until);
		}
		
		Meteor.subscribe("sales",
			since,
			until, 
			Session.get("salesfilter_userId"), 
			Session.get("salesfilter_clientId"), 
			Session.get("salesfilter_storeId"), 
			Session.get("salesfilter_paymentMethod"));
	});
});

function SalesViewModel() {
	this.sales = mko.collectionObservable(Sales, {}, {sort: {timestamp: -1}});
	
	this.filterTotal = ko.computed(function() {
		var total = 0;
		this.sales().forEach(function(sale) { total += sale.total;});
		return total;
	}.bind(this));
	
	this.dateRanges = [{name: "Today", value: "today"}, 
		{name: "This month", value: "thisMonth"}];
	this.dateRange = mko.sessionObservable("salesfilter_dateRange");

	this.users = mko.collectionObservable(Meteor.users, {});
	this.user = mko.sessionObservable("salesfilter_userId");
	
	this.clients = mko.collectionObservable(Clients, {});
	this.client = mko.sessionObservable("salesfilter_clientId");

	this.stores = mko.collectionObservable(Stores, {});
	this.store = mko.sessionObservable("salesfilter_storeId");
	
	this.paymentMethods = ["card", "cash"];
	this.paymentMethod = mko.sessionObservable("salesfilter_paymentMethod");
	
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

