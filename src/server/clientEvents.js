Meteor.publish("clientEvents", function(since, until) {
	var query = {};
	if (since || until) {
		query.timestamp = {};
		if (since) query.timestamp["$gte"] = since;
		if (until) query.timestamp["$lte"] = until;
	}
	return ClientEvents.find(query);
});

/*
 * Checks that a ClientEvent is valid.
 */
LighTPV.checkEvent = function(clientId, event) {
	if (event.clientId != clientId) throw new Meteor.Error("Invalid event ["+event._id+"]: client mismatch ("+event.client+" / "+clientId+")");
};
