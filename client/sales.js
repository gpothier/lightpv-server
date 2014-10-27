Meteor.startup(function() {
	Meteor.autorun(function() {
		Meteor.subscribe("sales", null);
	});
});

Template.sales.helpers({
	sales: function () {
		return Sales.find({}, {sort: {timestamp: -1}});
	}
});