var xml2js = Meteor.npmRequire("xml2js");
var request = Meteor.npmRequire("request");

var prestashop_key = "XNGDONOUGJJ3MKYX0JX9JBW5LYOM4RRS";

function download() {
	var url = "http://www.luki.cl/api/products?display=[id,name,price,ean13,id_default_image]";

	request.get(url,
				{ "auth": {"user": prestashop_key, "pass": "", "sendImmediately": false } },
				Meteor.bindEnvironment(function (error, response, body) {
		if (!error && response.statusCode == 200) {
			parse(body);
		} else {
			console.log("Products download failed");
		}
	}));
}


function parse(content) {
	xml2js.parseString(content, Meteor.bindEnvironment(function (err, result) {
		var products = result["prestashop"]["products"][0]["product"];
		//products = products.slice(0, 20);

		console.log("Updating products...");
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
				{$set: {ean13: ean13, price: price, name: name, image_url: image_url}},
				{upsert: true});
		});
		//updateImages();
		console.log("Done updating products.");
	}));
}


Meteor.startup(function () {
	download();
	Meteor.setInterval(function() {
		download();
	}, 60*60*1000);
});
