/**
	Sale
	----
	store: store id
	client: client id
	user: user id
	timestamp
	serverTimestamp
	items[]
		product: product id
		price: price of the product at the time the order was taken
		qty
	discount: discount percentage
	promotions: [{promotionId: xxx, timesApplied: xxx, discountValue: xxx}, ...]
	total: total value of the sale (should match items+discount)
	slip: number of the sales slip
	registered: boolean that indicates if the sale has been registered with Prestashop
	summary: id of the StockSummaries document that accounted this sale
*/
Sales = new Mongo.Collection("sales");

Sales.helpers({
	clientObj: function() {
		if (! this._clientObj) this._clientObj = Clients.findOne(this.client);
		return this._clientObj;
	},
	storeObj: function() {
		if (! this._storeObj) this._storeObj = Stores.findOne(this.store);
		return this._storeObj;
	},
	userObj: function() {
		if (! this._userObj) this._userObj = Meteor.users.findOne(this.user);
		return this._userObj;
	}
});

