Meteor.publish("users", function () {
	return Meteor.users.find({}, {fields: {"username": 1}});
});

Meteor.startup(function () {
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
});

Meteor.methods({
	updateUsers: function(clientId, token, users) {
		var client = LighTPV.checkClient(clientId, token);
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
});