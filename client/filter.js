function FilterViewModel() {
	this.dateRanges = [
		{name: "Today", value: "today"}, 
		{name: "This month", value: "thisMonth"},
		{name: "Range", value: "range"}];
	this.dateRange = ko.observable("today");
	
	this._dateRangeListener = ko.computed(function() {
		var since = null;
		var until = null;
		var dateRange = this.dateRange();
		
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
			} else if (dateRange.value == "range") {
				selectDateRangeDialog();
				return;
			}
		}
		
		console.log("Since: "+since+", until: "+until);
		Session.set("filter_date", [since, until]); 
	}.bind(this));

	this.users = mko.collectionObservable(Meteor.users, {});
	this.user = mko.sessionObservable("filter_userId");
	
	this.clients = mko.collectionObservable(Clients, {});
	this.client = mko.sessionObservable("filter_clientId");

	this.stores = mko.collectionObservable(Stores, {});
	this.store = mko.sessionObservable("filter_storeId");
	
	this.paymentMethods = ["card", "cash"];
	this.paymentMethod = mko.sessionObservable("filter_paymentMethod");
}

Template.filter.rendered = function() {
	var view = new FilterViewModel();
	ko.applyBindings(view, $("#filter-pane")[0]);
};

