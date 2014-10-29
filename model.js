
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
	lastActivity: timestamp of the last time the client connected to the server
 */
Clients = new Mongo.Collection("clients");

/*
	ClientEvents
	--------
	Represents events that occur at a client, such as opening or closing
	
	client: client id
	user: id of the user that generated the event
	timestamp 
	event: opening|closing|withdrawal
	cash: amount of cash of the event
	comment: a human-generated comment for the event
	errors[]: problems caused by the creation of this event
 */
ClientEvents = new Mongo.Collection("clientEvents");


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

getParameter = function(name) {
	var p = Parameters.findOne({name: name});
	return p ? p.value : null;
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
