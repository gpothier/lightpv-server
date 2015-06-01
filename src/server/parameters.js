Meteor.publish("parameters", function() {
	return Parameters.find();
});

Meteor.methods({
	setParameter: function(name, value) {
		var clientIP = this.connection.clientAddress;		
		console.log("set parameter: "+clientIP);
		setParameter(name, value);
	},
});

Meteor.startup(function () {
	setParameter("currentTime", new Date());
	Meteor.setInterval(function() {
		setParameter("currentTime", new Date());
	}, 1*1000);
});
