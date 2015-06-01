Meteor.startup(function() {
	Meteor.subscribe("parameters");
});

Accounts.ui.config({
	 passwordSignupFields: "USERNAME_ONLY"
});

filters = {};
filters.admin = function(pause) {
	if (! Roles.userIsInRole(Meteor.user(), "admin")) {
		this.render("forbidden");
		pause();
	} else {
		this.next();
	}
};	

Router.configure({
	loadingTemplate: "loading",
	layoutTemplate: "lightpvServerLayout"	
});

Router.onBeforeAction(function(pause) {
	if (!this.ready()) {
		this.render("loading");
		pause();
	} else {
		this.next();
	}
});

Router.map(function () {
	this.route("home", {
		path: "/",
		onBeforeAction: filters.admin,
		waitOn: function () {
			return [Meteor.subscribe("stores"), 
				Meteor.subscribe("clients"), 
				Meteor.subscribe("products"),
				Meteor.subscribe("users"),
				Meteor.subscribe("promotions")];
		}
	});
});
