/*
	Parameter
	---------
	Used to store key-value pairs.
	
	name
	value
*/
Parameters = new Mongo.Collection("parameters");

getParameter = function(name, defaultValue) {
	defaultValue = typeof defaultValue !== "undefined" ? defaultValue : null;
	var p = Parameters.findOne({name: name});
	return p ? p.value : defaultValue;
};

setParameter = function(name, value) {
	if (Meteor.isServer) {
		Parameters.update(
					{name: name},
					{$set: {value: value}},
					{upsert: true});
	} else {
		Meteor.call("setParameter", name, value);
	}
};
