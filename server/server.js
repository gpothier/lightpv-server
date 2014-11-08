var xml2js = Meteor.npmRequire("xml2js");
var request = Meteor.npmRequire("request");


LighTPV = {};
LighTPV.config = {};

Meteor.startup(function () {
	Meteor.publish("clients", function () {
		return Clients.find();
	});
	
	Meteor.publish("stores", function () {
		return Stores.find();
	});
	
	Meteor.publish("products", function () {
		return Products.find({}, {fields: {"marked": 0}});
	});
	
	Meteor.publish("users", function () {
		return Meteor.users.find({}, {fields: {"username": 1}});
	});
	
	Meteor.publish("sales", function (since, until, userId, clientId, storeId, paymentMethod) {
		var query = {};
		if (userId) query.user = userId;
		if (clientId) query.client = clientId;
		if (storeId) query.store = storeId;
		if (paymentMethod) query.paymentMethod = paymentMethod;
		if (since || until) {
			query.timestamp = {};
			if (since) query.timestamp["$gte"] = since;
			if (until) query.timestamp["$lte"] = until;
		}
		return Sales.find(query);
	});
	
	Meteor.publish("parameters", function() {
		return Parameters.find();
	});
	
	Meteor.publish("events", function() {
		return ClientEvents.find();
	});
	
	if (Meteor.users.find().count() === 0) {
		console.log("Adding initial admin data");
		var id = Accounts.createUser({
			username:"admin",
			email:"admin@luki.cl",
			password:"admin2550.908",
			admin: true,
			profile: {name:"Administrator"}});
		Roles.addUsersToRoles(id, ["admin", "manage-users"]);
	}
	
	if (Stores.find().count() === 0) {
		console.log("Adding initial stores");
		Stores.insert({ "_id" : "dummy", "name" : "Dummy for testing", "users" : [ ] });
	}
	
	LighTPV.config.serverPassword = process.env.LIGHTPV_KEY; 
	
	setParameter("currentTime", new Date());
	Meteor.setInterval(function() {
		setParameter("currentTime", new Date());
	}, 1*1000);
	
	LighTPV.updateProducts();
});

/*
 * Checks that a sale is valid.
 */
var checkSale = function(clientId, sale) {
	if (sale.client != clientId) throw new Meteor.Error("Invalid sale ["+sale._id+"]: client mismatch ("+sale.client+" / "+clientId+")");
	if (! sale.store) throw new Meteor.Error("Invalid sale ["+sale._id+"]: no store");
	if (! Stores.findOne(sale.store)) throw new Meteor.Error("Invalid sale ["+sale._id+"]: store not found: "+sale.store);
	
	var total_ref = 0;

	sale.items.forEach(function(item) {
		var product = Products.findOne(item.product);
		var subtotal = item.qty * item.price;
		total_ref += subtotal;
	});
	total_ref = Math.round(total_ref * (100-sale.discount)/100);
	if (total_ref != sale.total) throw new Meteor.Error("Invalid sale ["+sale._id+"]: totals do not match: "+sale.total+" != "+total_ref);
};

/*
 * Checks that a ClientEvent is valid.
 */
var checkEvent = function(clientId, event) {
	if (event.clientId != clientId) throw new Meteor.Error("Invalid event ["+event._id+"]: client mismatch ("+event.client+" / "+clientId+")");
};

Meteor.methods({
	setParameter: function(name, value) {
		var clientIP = this.connection.clientAddress;		
		console.log("set parameter: "+clientIP);
		setParameter(name, value);
	},
	
	registerClientOnServer: function(hostname, password) {
		if (password != LighTPV.config.serverPassword) {
			console.log("Password mismatch: "+password+" / "+LighTPV.config.serverPassword);
			throw new Meteor.Error("Incorrect password");
		}
		
		var clients = Clients.find({hostname: hostname}); 
		if (clients.count() == 0) {
			console.log("Creating client for hostname: "+hostname);
			var uuid = Meteor.npmRequire("node-uuid");
			var clientId = Clients.insert({
				hostname: hostname,
				token: uuid.v4()});
			var client = Clients.findOne(clientId);
		} else if (clients.count() == 1) {
			console.log("Returning existing client for hostname: "+hostname);
			var client = clients.fetch()[0];
		} else throw new Meteor.Error("INTERNAL ERROR: Several client objects match hostname: "+hostname);
		
		console.log("Client: "+JSON.stringify(client));
		return client;
	},
	
	updateUsers: function(clientId, token, users) {
		var client = checkClient(clientId, token);
		for(var i=0;i<users.length;i++) {
			var user = users[i];
			if (Roles.userIsInRole(user, "admin")) throw new Meteor.Error("Attempting to add admin user");
			
			var id = user._id;
			delete user["_id"];

			Meteor.users.update(id, {$set: user}, {upsert: true});
		}
		
		var localUsers = [];
		Meteor.users.find().forEach(function(user) {
			if (! Roles.userIsInRole(user, "admin")) localUsers.push(user);
		});
		
		return localUsers;
	},
	
	getStores: function(clientId, token) {
		var client = checkClient(clientId, token);
		return Stores.find().fetch();
	},
	
	getCatalog: function() {
		return {"products": Products.find().fetch(), "version": getParameter("catalogVersion")};
	},
	
	getCatalogVersion: function() {
		return getParameter("catalogVersion");
	},
	
	forceProductUpdate: function(clientId, token) {
		LighTPV.updateProducts();
	},
	
	push: function(clientId, token, storeId, sales, events) {
		var client = checkClient(clientId, token);
		delete client["_id"];
		
		// Sanity check
		for(var i=0;i<sales.length;i++) checkSale(clientId, sales[i]);
		for(var i=0;i<events.length;i++) checkEvent(clientId, events[i]);
		
		// Process sales and events in timestamp order
		var ts = new Date();
		var pushedSales = [];
		var pushedEvents = [];
		
		try {
			var saleIndex = 0;
			var eventIndex = 0;
			
			// Helper functions to retrieve sales and events in timestamp order
			function popSale() {
				return {type: "sale", value: sales[saleIndex++]};
			}
			
			function popEvent() {
				return {type: "event", value: events[eventIndex++]};
			}
			
			function popItem() {
				var nextSale = saleIndex < sales.length ? sales[saleIndex] : null;
				var nextEvent = eventIndex < events.length ? events[eventIndex] : null;

				if (! nextSale && ! nextEvent) return null;
				if (! nextEvent) return popSale();
				if (! nextSale) return popEvent();
				
				if (nextSale.timestamp < nextEvent.timestamp) return popSale(); 
				else return popEvent();
			}
			
			// Process sale
			function pushSale(sale) {
				console.log("Adding sale: "+JSON.stringify(sale));
				
				sale.serverTimestamp = ts;
				Sales.insert(sale);
				
				if (sale.paymentMethod == "cash") {
					client.currentCash += sale.total;
					Clients.update(clientId, {$set: {currentCash: client.currentCash}});
					console.log("    New client state: "+JSON.stringify(client));
				}
				
				pushedSales.push(sale._id);
			}
			
			// Process event
			function pushEvent(event) {
				console.log("Adding event: "+JSON.stringify(event));
				
				event.serverTimestamp = ts;
				
				var errors = [];
				
				if (! client.accumulatedCashDelta) client.accumulatedCashDelta = 0;
				
				if (event.event == "opening") {
					if (client.currentUser) errors.push("Client already open by "+client.currentUser);
					var cashDelta = event.cash - client.currentCash;
					if (cashDelta != 0) errors.push("Cash mismatch on open: current: "+client.currentCash+", new: "+event.cash);
					
					client.currentUser = event.userId;
					client.currentCash = event.cash;
					client.accumulatedCashDelta += cashDelta;
				} else if (event.event == "closing") {
					if (client.currentUser == event.userId) client.currentUser = null;
					else errors.push("Client not open by "+event.userId+" but by "+client.currentUser+"; not closing");
					
					var cashDelta = event.cash - client.currentCash;
					if (cashDelta != 0) errors.push("Cash mismatch on close: current: "+client.currentCash+", new: "+event.cash);
					client.currentCash = event.cash;
					client.accumulatedCashDelta += cashDelta;
				} else if (event.event == "withdrawal") {
					if (client.currentUser != event.userId) errors.push("Sending withdrawal by "+event.userId+", but client opened by "+client.currentUser);
					client.currentCash -= event.cash;
				} else throw new Meteor.Error("INTERNAL ERROR: wrong event type: "+JSON.stringify(event));
				
				if (errors.length > 0) {
					event.errors = errors;
					console.log("    Event errors: "+JSON.stringify(errors));
				}
				Clients.update(clientId, {$set: {
					currentUser: client.currentUser, 
					currentCash: client.currentCash,
					accumulatedCashDelta: client.accumulatedCashDelta}});
				ClientEvents.insert(event);
				
				console.log("    New client state("+clientId+"): "+JSON.stringify(client));
				
				pushedEvents.push(event._id);
			}
			
			// Processing loop
			while(true) {
				var item = popItem();
				if (! item) break;
				
				if (item.type == "sale") pushSale(item.value);
				else if (item.type = "event") pushEvent(item.value);
				else throw new Meteor.Error("INTERNAL ERROR: wrong item type: "+JSON.stringify(item)); 
			}			
			
			
		} catch(e) {
			console.log("Error while inserting sales: "+e);
		}
		
		Clients.update(clientId, {$set: {lastActivity: ts, store: storeId}});
			
		return {sales: pushedSales, events: pushedEvents};
	}
});

function checkClient(clientId, token) {
	var clients = Clients.find(clientId); 
	if (clients.count() == 1) {
		var client = clients.fetch()[0];
		if (client.token == token) return client;
	} 
	throw new Meteor.Error("Authentication error");
}

var prestashop_key = "XNGDONOUGJJ3MKYX0JX9JBW5LYOM4RRS";

function downloadProducts() {
	var url = "http://www.luki.cl/api/products?display=[id,name,price,ean13,id_default_image]";

	request.get(url,
				{ "auth": {"user": prestashop_key, "pass": "", "sendImmediately": false } },
				Meteor.bindEnvironment(function (error, response, body) {
		if (!error && response.statusCode == 200) {
			parseProducts(body);
			
			var catalogVersion = getParameter("catalogVersion");
			if (! catalogVersion) catalogVersion = 0;
			catalogVersion += 1;
			setParameter("catalogVersion", catalogVersion);
		} else {
			console.log("Products download failed");
		}
	}));
}


function parseProducts(content) {
	xml2js.parseString(content, Meteor.bindEnvironment(function (err, result) {
		var products = result["prestashop"]["products"][0]["product"];
		//products = products.slice(0, 20);

		console.log("Updating products...");
		
		Products.update({}, { $set: { marked: true } }, { multi: true });
		
		products.forEach(function(product) {
			var id = product["id"][0];
			var ean13 = product["ean13"][0];
			var price = product["price"][0];
			var name = product["name"][0]["language"][0]["_"];
			var image_url = product["id_default_image"][0]["$"]["xlink:href"];

			if (image_url) {
				var parts = image_url.split("/");
				var image_ps_id = parts[parts.length-1];
				image_url = "http://www.luki.cl/" + image_ps_id + "-home_default/img.jpg";
			}

			Products.update(
				id,
				{
					$set: {ean13: ean13, price: price, name: name, image_url: image_url},
					$unset: { marked: "" }},
				{upsert: true});
		});

		var toRemove = Products.find({marked: true}).fetch();
		console.log("Removing "+toRemove.length+" products");
		toRemove.forEach(function(product) {
			console.log("    "+JSON.stringify(product));
		});
		Products.remove({marked: true});

		console.log("Done updating products.");
	}));
}

LighTPV.updateProducts = function() {
	if (LighTPV._updateProductsTimeout) Meteor.clearTimeout(LighTPV._updateProductsTimeout);
	try {
		downloadProducts();
	} catch(e) {
		console.log("Error while updating catalog: "+e);
	}
	// Reschedule push (not using setInterval to avoid overlapping calls)
	LighTPV._updateProductsTimeout = Meteor.setTimeout(LighTPV.updateProducts, 4*60*60*1000);
};
