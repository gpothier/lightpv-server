Meteor.startup(function() {
	Meteor.subscribe("events", null);
});

Template.eventslist.helpers({
	events: function() {
		return ClientEvents.find({}, {sort: {timestamp: -1}});
	}
});