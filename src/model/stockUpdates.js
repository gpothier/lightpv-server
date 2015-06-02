/*
	StockUpdate
	----
	store: store id
	client: client id
	user: user id
	timestamp
	serverTimestamp
	items[]
		product: product id
		qty
*/
StockUpdates = new Mongo.Collection("stockUpdates");

StockUpdates.helpers({
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

/*
 * Checks that a stock update is valid.
 */
LighTPV.checkStockUpdate = function(clientId, stockUpdate) {
	if (stockUpdate.client != clientId) throw new Meteor.Error("Invalid stockUpdate ["+sale._id+"]: client mismatch ("+stockUpdate.client+" / "+clientId+")");
	if (! stockUpdate.store) throw new Meteor.Error("Invalid stockUpdate ["+stockUpdate._id+"]: no store");
	if (! Stores.findOne(stockUpdate.store)) throw new Meteor.Error("Invalid stockUpdate ["+stockUpdate._id+"]: store not found: "+stockUpdate.store);
};
