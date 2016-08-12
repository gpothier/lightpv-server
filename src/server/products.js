var xml2js = Meteor.npmRequire("xml2js");
var request = Meteor.npmRequire("request");

Meteor.publish("products", function () {
	return Products.find({}, {fields: {"marked": 0}});
});

Meteor.methods({
	forceProductUpdate: function() {
		LighTPV.updateProducts();
	},
	
	getProductsCollections: function(clientId, token) {
		LighTPV.checkClient(clientId, token);
		return {
			"products": Products.find().fetch(), 
			"version": getParameter("productsVersion")};
	},
});

Meteor.startup(function () {
	LighTPV.updateProducts();
});


var prestashop_key = "XNGDONOUGJJ3MKYX0JX9JBW5LYOM4RRS";

function downloadProducts() {
	var url = "http://www.luki.cl/api/products?display=[id,name,price,ean13,id_default_image]";

	request.get(url,
				{ "auth": {"user": prestashop_key, "pass": "", "sendImmediately": false } },
				Meteor.bindEnvironment(function (error, response, body) {
		if (!error && response.statusCode == 200) {
			parseProducts(body);
			
			var catalogVersion = getParameter("productsVersion", 0);
			catalogVersion += 1;
			setParameter("productsVersion", catalogVersion);
			
			console.log("New product catalog version: ", catalogVersion);
		} else {
			console.log("Products download failed");
		}
	}));
}


function parseProducts(content) {
	xml2js.parseString(content, Meteor.bindEnvironment(function (err, result) {
		var products = result["prestashop"]["products"][0]["product"];
		//products = products.slice(0, 20);

		console.log("Updating products...");
		
		Products.update({}, { $set: { marked: true } }, { multi: true });
		
		products.forEach(function(product) {
			var id = product["id"][0];
			var ean13 = product["ean13"][0];
			var price = product["price"][0];
			var name = product["name"][0]["language"][0]["_"];
			var image_url = product["id_default_image"][0]["$"]["xlink:href"];

			if (image_url) {
				var parts = image_url.split("/");
				var image_ps_id = parts[parts.length-1];
				image_url = "http://www.luki.cl/" + image_ps_id + "-home_default/img.jpg";
			}

			Products.update(
				id,
				{
					$set: {ean13: ean13, price: price, name: name, image_url: image_url},
					$unset: { marked: "" }},
				{upsert: true});
		});

		var toRemove = Products.find({marked: true}).fetch();
		console.log("Removing "+toRemove.length+" products");
		toRemove.forEach(function(product) {
			console.log("    "+JSON.stringify(product));
		});
		Products.remove({marked: true});

		console.log("Done updating products.");
	}));
}

LighTPV.updateProducts = function() {
	if (LighTPV._updateProductsTimeout) Meteor.clearTimeout(LighTPV._updateProductsTimeout);
	try {
		downloadProducts();
	} catch(e) {
		console.log("Error while updating catalog: "+e);
	}
	// Reschedule push (not using setInterval to avoid overlapping calls)
	LighTPV._updateProductsTimeout = Meteor.setTimeout(LighTPV.updateProducts, 4*60*60*1000);
};
