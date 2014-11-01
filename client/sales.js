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
				since.setHours(23, 59, 59, 999);
			} else if (dateRange.value == "thisMonth") {
				since = new Date();
				since.setHours(0, 0, 0, 0);
				since.setDate(1);
				until = new Date(since);
				until.setMonth(until.getMonth()+1);
				until.setDate(0);
				since.setHours(23, 59, 59, 999);
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

Template.sales.helpers({
	sales: function () {
		return Sales.find({}, {sort: {timestamp: -1}});
	},
	filterTotal: function() {
		var total = 0;
		Sales.find({}).forEach(function(sale) { total += sale.total;});
		return total;
	}
});

function SalesFilterModel() {
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
}

Template.sales.rendered = function() {
	var view = new SalesFilterModel();
	ko.applyBindings(view, $("#sales-pane")[0]);
};
