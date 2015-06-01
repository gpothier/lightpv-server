Meteor.startup(function() {
	Meteor.autorun(function() {
		var filter_date = Session.get("filter_date");
		if (filter_date) Meteor.subscribe("events", filter_date[0], filter_date[1]);
	});
});

Template.eventslist.helpers({
	events: function() {
		return ClientEvents.find({}, {sort: {timestamp: -1}});
	}
});