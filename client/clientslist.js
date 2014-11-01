Meteor.startup(function() {
	Meteor.subscribe("clients", null);
});

Template.clientslist.helpers({
	clients: function () {
		return Clients.find({}, {sort: {hostname: 1}});
	},
	lastConnection: function() {
		var t0 = moment(getParameter("currentTime"));
		var t1 = moment(this.lastActivity);
		var dt = t1.isBefore(t0) ? t1.from(t0) : t1.from(t1);
		return dt;
	},
	currentUser: function() {
		var user = this.currentUser ? Meteor.users.findOne(this.currentUser) : null;
		return user ? user.username : "";
	}
});