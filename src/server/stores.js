Meteor.publish("stores", function () {
	return Stores.find();
});

Meteor.startup(function () {
	if (Stores.find().count() === 0) {
		console.log("Adding initial stores");
		Stores.insert({ "_id" : "dummy", "name" : "Dummy for testing", "users" : [ ] });
	}
});

Meteor.methods({
	getStores: function(clientId, token) {
		var client = LighTPV.checkClient(clientId, token);
		return Stores.find().fetch();
	},
});