SubscriptionManager = function(collectionName) {
	var handle = null;
	return function() {
		if (handle) handle.stop();
		
		var args = [collectionName];
		for(var i=0;i<arguments.length;i++) args.push(arguments[i]);
		handle = Meteor.subscribe.apply(null, args);
	}
};

SubscriptionManager.Sales = SubscriptionManager("sales");
SubscriptionManager.StockSummaries = SubscriptionManager("stockSummaries");
SubscriptionManager.StockUpdates = SubscriptionManager("stockUpdates");
SubscriptionManager.Promotions = SubscriptionManager("promotions");
SubscriptionManager.ClientEvents = SubscriptionManager("clientEvents");

function TabsViewModel() {
	this.salesView = new SalesViewModel();
	this.productsSalesView = new ProductSalesViewModel();
	this.stockView = new StockViewModel();
	this.eventsView = new EventsViewModel();
	this.promotionsView = new PromotionsViewModel();
	
	this.selectedTab = ko.observable("sales");
	
	this.view = ko.computed(function() {
		var t = this.selectedTab();
		if (t == "sales") this.salesView.activate();
		else if (t == "products") this.productsSalesView.activate(); 
		else if (t == "stock") this.stockView.activate(); 
		else if (t == "events") this.eventsView.activate(); 
		else if (t == "promotions") this.promotionsView.activate();
		else return null;
	}.bind(this));
	
}

Template.home.rendered = function() {
	var view = new TabsViewModel();
	ko.applyBindings(view, $("#tabs")[0]);
};

