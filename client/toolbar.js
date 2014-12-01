Template.toolbar.helpers({
	catalogVersion: function () {
		return getParameter("catalogVersion");
	},
	currentTime: function () {
		return getParameter("currentTime");
	}

});

Template.toolbar.events({
	"click #update-catalog": function (event) {
		Meteor.call("forceProductUpdate");
	}
});
