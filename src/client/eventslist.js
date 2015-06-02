EventsViewModel = function() {
	this.events = mko.collectionObservable(ClientEvents, {}, {sort: {timestamp: -1}});
	
	this.dateRange = ko.observable();
	
	this.activated = null;
	this.activate = function() {
		if (! this.activated) {
			this.activated = true;
			ko.computed(this.activate, this); // makes subscription reactive
			return;
		}
		if (this.dateRange()) SubscriptionManager.ClientEvents(
				this.dateRange()[0],
				this.dateRange()[1]);
	};
};
