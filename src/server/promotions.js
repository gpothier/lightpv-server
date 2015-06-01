Meteor.publish("promotions", function() {
	return Promotions.find();
});

Meteor.methods({
	getPromotionsCollection: function(clientId, token) {
		checkClient(clientId, token);
		
		var today = new Date();
		query = { "startDate": { "$lte": today }, "endDate": { "$gte": today }};
		
		return {
			"promotions": Promotions.find(query).fetch(), 
			"version": getParameter("promotionsVersion")};		
	},

	createPromotion: function(promotion) {
		Promotions.insert(promotion);
		var v = getParameter("promotionsVersion", 0);
		setParameter("promotionsVersion", v+1);
	},
	
	
});