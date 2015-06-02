Meteor.publish("sales", function (since, until, userId, clientId, storeId, paymentMethod, notSummarized) {
	var query = {};
	if (userId) query.user = userId;
	if (clientId) query.client = clientId;
	if (storeId) query.store = storeId;
	if (paymentMethod) query.paymentMethod = paymentMethod;
	if (since || until) {
		query.timestamp = {};
		if (since) query.timestamp["$gte"] = since;
		if (until) query.timestamp["$lte"] = until;
	}
	if (notSummarized) query.summaryId = { $exists: false };
	return Sales.find(query);
});

/*
 * Checks that a sale is valid.
 */
LighTPV.checkSale = function(clientId, sale) {
	if (sale.client != clientId) throw new Meteor.Error("Invalid sale ["+sale._id+"]: client mismatch ("+sale.client+" / "+clientId+")");
	if (! sale.store) throw new Meteor.Error("Invalid sale ["+sale._id+"]: no store");
	if (! Stores.findOne(sale.store)) throw new Meteor.Error("Invalid sale ["+sale._id+"]: store not found: "+sale.store);
	if (sale.discount > 15) throw new Meteor.Error("Invalid sale ["+sale._id+"]: discount too big");
	
	var total_ref = 0;

	sale.items.forEach(function(item) {
		var product = Products.findOne(item.product);
		var subtotal = item.qty * item.price;
		total_ref += subtotal;
	});
	
	var promotions_ref = appliedPromotions(sale.timestamp, sale.items);
	if (promotions_ref.length != sale.promotions.length) {
		logger.warn("Number of promotions do not match, expected "
				+JSON.stringify(promotions_ref)+", got "
				+JSON.stringify(sale.promotions));	
		throw new Meteor.Error("Number of promotions do not match");
	} 
	
	for (var i=0;i<promotions_ref.length;i++) {
		var promo_ref = promotions_ref[i];
		var promo = sale.promotions[i];
		if (promo_ref.promotion._id != promo.promotionId) 
			throw new Meteor.Error("Promotion id mismatch: expected "+promo_ref.promotion._id+", got: "+promo.promotionId);
		if (promo_ref.timesApplied != promo.timesApplied) 
			throw new Meteor.Error("Promotion timesApplied mismatch: expected: "+promo_ref.timesApplied+", got: "+promo.timesApplied);
		if (promo_ref.discountValue != promo.discountValue) 
			throw new Meteor.Error("Promotion discountValue mismatch: expected: "+promo_ref.discountValue+", got: "+promo.discountValue);
		total_ref -= promo_ref.discountValue;
	}
	
	total_ref = Math.round(total_ref * (100-sale.discount)/100);
	if (total_ref != sale.total) throw new Meteor.Error("Invalid sale ["+sale._id+"]: totals do not match: "+sale.total+" != "+total_ref);
};

