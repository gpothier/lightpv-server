Router.configure({
	loadingTemplate: "loading"
});

Router.onBeforeAction(function(pause) {
	if (!this.ready()) {
		this.render("loading");
		pause(); // otherwise the action will just render the main template.
	}
});

Router.map(function () {
	this.route("sales", {
		path: "/",
		waitOn: function () {
			return [Meteor.subscribe("stores"), 
				Meteor.subscribe("clients"), 
				Meteor.subscribe("products"),
				Meteor.subscribe("users")];
		}
	});
});
