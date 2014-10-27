
/*
	Products
	--------
	ps_id: prestashop product id
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
	lastActivity: timestamp of the last time the client connected to the server
 */
Clients = new Mongo.Collection("clients");

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
		qty
	discount: discount percentage
	slip: number of the sales slip
	registered: boolean that indicates if the sale has been registered with Prestashop
*/
Sale = function (doc) {
	_.extend(this, doc);
};
_.extend(Sale.prototype, {
	total: function () {
		var total = 0;
		this.items.forEach(function(item) {
			if (! item._productObj) item._productObj = Products.findOne(item.product);
			total += item.qty * item._productObj.price;
		});
		return Math.round(total * (100-this.discount)/100);
	},
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
	var p = Parameters.find({name: name}).fetch();
	return p.length > 0 ? p[0].value : null;
};

setParameter = function(name, value) {
	Parameters.update(
				{name: name},
				{$set: {value: value}},
				{upsert: true});
};
