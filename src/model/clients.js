/*
	Clients
	--------
	Represents a LighTPV client machine
	
	hostname
	token: a security token created the first time a client connects to the server
	store: store id
	currentUser: user currently using the client, or null if client closed
	currentCash: cash currently expected at the client
	accumulatedCashDelta: sum of cash differences
	lastActivity: timestamp of the last time the client connected to the server
 */
Client = function (doc) {
	_.extend(this, doc);
};
_.extend(Client.prototype, {
	storeObj: function() {
		if (! this._storeObj) this._storeObj = Stores.findOne(this.store);
		return this._storeObj;
	},
	currentUserObj: function() {
		if (! this._currentUserObj) this._currentUserObj = Meteor.users.findOne(this.currentUser);
		return this._currentUserObj;
	}
});

Clients = new Mongo.Collection("clients", {
	transform: function (doc) { return new Client(doc); }
});
