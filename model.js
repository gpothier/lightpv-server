
/*
	Products
	--------
	(_id: prestashop product id)
	name: product name
	ean13: EAN13 code of the product
	price: product price
*/
Products = new Mongo.Collection("products");

/*
	Stores
	--------
	name
	users[]: ids of allowed users
 */
Stores = new Mongo.Collection("stores");

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

/*
	ClientEvents
	--------
	Represents events that occur at a client, such as opening or closing
	
	clientId: client id
	userId: id of the user that generated the event
	timestamp 
	serverTimestamp
	event: opening|closing|withdrawal
	cash: amount of cash of the event
	errors[]: problems caused by the creation of this event, detected on the client
 */
ClientEvent = function (doc) {
	_.extend(this, doc);
};
_.extend(ClientEvent.prototype, {
	clientObj: function() {
		if (! this._clientObj) this._clientObj = Clients.findOne(this.clientId);
		return this._clientObj;
	},
	userObj: function() {
		if (! this._userObj) this._userObj = Meteor.users.findOne(this.userId);
		return this._userObj;
	}

});

ClientEvents = new Mongo.Collection("clientEvents", {
	transform: function (doc) { return new ClientEvent(doc); }
});


/*
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
*/
Sale = function (doc) {
	_.extend(this, doc);
};
_.extend(Sale.prototype, {
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

Sales = new Mongo.Collection("sales", {
	transform: function (doc) { return new Sale(doc); }
});

/*
	Parameter
	---------
	Used to store key-value pairs.
	
	name
	value
*/
Parameters = new Mongo.Collection("parameters");

getParameter = function(name, defaultValue) {
	defaultValue = typeof defaultValue !== "undefined" ? defaultValue : null;
	var p = Parameters.findOne({name: name});
	return p ? p.value : defaultValue;
};

setParameter = function(name, value) {
	if (Meteor.isServer) {
		Parameters.update(
					{name: name},
					{$set: {value: value}},
					{upsert: true});
	} else {
		Meteor.call("setParameter", name, value);
	}
};

/*
	Promotion
	----
	name: Human-readable name for the promotion.
	startDate
	endDate
	type: type of promotion. The rest of the Promotion document depends on the type, as follows:
	-- type "mxn": Clients can buy M products for the price of N 
		productId
		m
		n
	-- type "percentage": A product is discounted by P percent
		productId
		p
*/
Promotions = new Mongo.Collection("promotions");

