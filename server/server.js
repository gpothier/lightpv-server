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
	
	Meteor.publish("sales", function (date) {
		//if (! date) return null;
		//date.setHours(0, 0, 0, 0);
		//return Sales.find({user: this.userId, timestamp: {$gte: date}});
		return Sales.find();
	});
	
	Meteor.publish("parameters", function() {
		return Parameters.find();
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
	
	LighTPV.config.serverPassword = process.env.LIGHTPV_KEY; 
	
	setParameter("currentTime", new Date());
	Meteor.setInterval(function() {
		setParameter("currentTime", new Date());
	}, 1*1000);
	
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
	
	getProducts: function() {
		return Products.find().fetch();
	},
	
	pushSales: function(clientId, token, sales) {
		var client = checkClient(clientId, token);
		
		// Sanity check
		for(var i=0;i<sales.length;i++) checkSale(clientId, sales[i]);
		
		// Insert sales
		var pushedSales = [];
		
		try {
			var ts = new Date();
			
			Clients.update(client, {$set: {lastActivity: ts}});

			for(var i=0;i<sales.length;i++) {
				var sale = sales[i];
				
				console.log("Adding sale: "+JSON.stringify(sale));
				
				sale.serverTimestamp = ts;
				Sales.insert(sale);
				
				pushedSales.push(sale._id);
			}
		} catch(e) {
			console.log("Error while inserting sales: "+e);
		}
		
		return pushedSales;
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

