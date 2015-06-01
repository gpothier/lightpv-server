/*
	ClientEvents
	--------
	Represents events that occur at a client, such as opening or closing
	
	clientId: client id
	userId: id of the user that generated the event
	timestamp 
	serverTimestamp
	event: opening|closing|withdrawal
	cash: amount of cash of the event
	errors[]: problems caused by the creation of this event, detected on the client
 */
ClientEvents = new Mongo.Collection("clientEvents");

ClientEvents.helpers({
	clientObj: function() {
		if (! this._clientObj) this._clientObj = Clients.findOne(this.clientId);
		return this._clientObj;
	},
	userObj: function() {
		if (! this._userObj) this._userObj = Meteor.users.findOne(this.userId);
		return this._userObj;
	}
});
