
Meteor.startup(function () {
	LighTPV.config.serverPassword = process.env.LIGHTPV_KEY; 
});

Meteor.methods({
	getCollectionsVersions: function(clientId, token) {
		LighTPV.checkClient(clientId, token);
		return { 
			"products": getParameter("productsVersion"),
			"promotions": getParameter("promotionsVersion") };
	},
	
	push: function(clientId, token, storeId, sales, events, stockUpdates) {
		var client = LighTPV.checkClient(clientId, token);
		delete client["_id"];
		
		// Sanity check
		for(var i=0;i<sales.length;i++) {
			var sale = sales[i];
			try {
				LighTPV.checkSale(clientId, sale);
			} catch(e) {
				console.log("Sale check error: "+JSON.stringify(sale));
				console.log(e);
				throw e;
			}
		}
		for(var i=0;i<events.length;i++) {
			var event = events[i];
			try {
				LighTPV.checkEvent(clientId, event);
			} catch(e) {
				console.log("Event check error: "+JSON.stringify(event));
				console.log(e);
				throw e;
			}
		}
		for(var i=0;i<stockUpdates.length;i++) {
			var stockUpdate = stockUpdates[i];
			try {
				LighTPV.checkStockUpdate(clientId, stockUpdate);
			} catch(e) {
				console.log("StockUpdate check error: "+JSON.stringify(stockUpdate));
				console.log(e);
				throw e;
			}
		}

		
		// Process sales and events in timestamp order
		var ts = new Date();
		var pushedSales = [];
		var pushedEvents = [];
		
		try {
			var saleIndex = 0;
			var eventIndex = 0;
			
			// Helper functions to retrieve sales and events in timestamp order
			function popSale() {
				return {type: "sale", value: sales[saleIndex++]};
			}
			
			function popEvent() {
				return {type: "event", value: events[eventIndex++]};
			}
			
			function popItem() {
				var nextSale = saleIndex < sales.length ? sales[saleIndex] : null;
				var nextEvent = eventIndex < events.length ? events[eventIndex] : null;

				if (! nextSale && ! nextEvent) return null;
				if (! nextEvent) return popSale();
				if (! nextSale) return popEvent();
				
				if (nextSale.timestamp < nextEvent.timestamp) return popSale(); 
				else return popEvent();
			}
			
			// Process sale
			function pushSale(sale) {
				console.log("Adding sale: "+JSON.stringify(sale));
				
				sale.serverTimestamp = ts;
				Sales.insert(sale);
				
				if (sale.paymentMethod == "cash") {
					client.currentCash += sale.total;
					Clients.update(clientId, {$set: {currentCash: client.currentCash}});
					console.log("    New client state: "+JSON.stringify(client));
				}
				
				pushedSales.push(sale._id);
			}
			
			// Process event
			function pushEvent(event) {
				console.log("Adding event: "+JSON.stringify(event));
				
				event.serverTimestamp = ts;
				
				var errors = [];
				
				if (! client.accumulatedCashDelta) client.accumulatedCashDelta = 0;
				
				if (event.event == "opening") {
					if (client.currentUser) errors.push("Client already open by "+client.currentUser);
					var cashDelta = event.cash - client.currentCash;
					if (cashDelta != 0) errors.push("Cash mismatch on open: current: "+client.currentCash+", new: "+event.cash);
					
					client.currentUser = event.userId;
					client.currentCash = event.cash;
					client.accumulatedCashDelta += cashDelta;
				} else if (event.event == "closing") {
					if (client.currentUser == event.userId) client.currentUser = null;
					else errors.push("Client not open by "+event.userId+" but by "+client.currentUser+"; not closing");
					
					var cashDelta = event.cash - client.currentCash;
					if (cashDelta != 0) errors.push("Cash mismatch on close: current: "+client.currentCash+", new: "+event.cash);
					client.currentCash = event.cash;
					client.accumulatedCashDelta += cashDelta;
				} else if (event.event == "withdrawal") {
					if (client.currentUser != event.userId) errors.push("Sending withdrawal by "+event.userId+", but client opened by "+client.currentUser);
					client.currentCash -= event.cash;
				} else throw new Meteor.Error("INTERNAL ERROR: wrong event type: "+JSON.stringify(event));
				
				if (errors.length > 0) {
					event.errors = errors;
					console.log("    Event errors: "+JSON.stringify(errors));
				}
				Clients.update(clientId, {$set: {
					currentUser: client.currentUser, 
					currentCash: client.currentCash,
					accumulatedCashDelta: client.accumulatedCashDelta}});
				ClientEvents.insert(event);
				
				console.log("    New client state("+clientId+"): "+JSON.stringify(client));
				
				pushedEvents.push(event._id);
			}
			
			// Processing loop
			while(true) {
				var item = popItem();
				if (! item) break;
				
				if (item.type == "sale") pushSale(item.value);
				else if (item.type = "event") pushEvent(item.value);
				else throw new Meteor.Error("INTERNAL ERROR: wrong item type: "+JSON.stringify(item)); 
			}			
			
			
		} catch(e) {
			console.log("Error while inserting sales: "+e);
		}
		
		var pushedStockUpdates = [];
		
		try {
			for(var i=0;i<stockUpdates.length;i++) {
				var stockUpdate = stockUpdates[i];
				
				console.log("Adding stock update: "+JSON.stringify(stockUpdate));
				
				stockUpdate.serverTimestamp = ts;
				StockUpdates.insert(stockUpdate);
				pushedStockUpdates.push(stockUpdate._id);
			}
		} catch(e) {
			console.log("Error while inserting stock updates: "+e);
		}
		
		
		Clients.update(clientId, {$set: {lastActivity: ts, store: storeId}});
			
		return {sales: pushedSales, events: pushedEvents, stockUpdates: pushedStockUpdates};
	}
});


