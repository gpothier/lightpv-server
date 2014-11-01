Meteor.startup(function() {
	Meteor.subscribe("events", null);
});

Template.eventslist.helpers({
	events: function() {
		return ClientEvents.find(
			{errors: {$exists: true, $not: {$size: 0}}},
			{sort: {timestamp: -1}});
	}
});