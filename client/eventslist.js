Meteor.startup(function() {
	Meteor.autorun(function() {
		Meteor.subscribe("events", 
			Session.get("filter_date")[0],
			Session.get("filter_date")[1]);
	});
});

Template.eventslist.helpers({
	events: function() {
		return ClientEvents.find({}, {sort: {timestamp: -1}});
	}
});