Template.toolbar.helpers({
	catalogVersion: function () {
		return getParameter("catalogVersion");
	},
	promotionsVersion: function () {
		return getParameter("promotionsVersion");
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
