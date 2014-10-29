Template.toolbar.helpers({
	catalogVersion: function () {
		return getParameter("catalogVersion");
	}
});

Template.toolbar.events({
	"click #update-catalog": function (event) {
		Meteor.call("forceProductUpdate");
	}
});
