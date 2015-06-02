ko.components.register("lt-filter-time", {
	template: { element: "lt-filter-time" },
	viewModel: function FilterViewModel(params) {
		this.dateRanges = [
			{name: "Today", value: "today"}, 
			{name: "This month", value: "thisMonth"},
			{name: "Range", value: "range"}];
		this.dateRange = ko.observable(this.dateRanges[0]);
	   	
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
			params.value([since, until]); 
		}.bind(this));
	}
});

ko.components.register("lt-filter-store", {
	template: { element: "lt-filter-store" },
	viewModel: function FilterViewModel(params) {
	   	this.stores = mko.collectionObservable(Stores, {});
	   	this.store = params.value;
	}
});

ko.components.register("lt-filter-user", {
	template: { element: "lt-filter-user" },
	viewModel: function FilterViewModel(params) {
		this.users = mko.collectionObservable(Meteor.users, {});
		this.user = params.value;
	}
});

ko.components.register("lt-filter-payment-method", {
	template: { element: "lt-filter-payment-method" },
	viewModel: function FilterViewModel(params) {
		this.paymentMethods = ["card", "cash"];
		this.paymentMethod = params.value;
	}
});

