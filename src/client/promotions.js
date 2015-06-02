PromotionsViewModel = function() {
	this.types = ["mxn", "percentage"];
	
	this.promotions = mko.collectionObservable(Promotions, {}, {sort: {startDate: -1}});
	
	this.activated = null;
	this.activate = function() {
		if (! this.activated) {
			this.activated = true;
			ko.computed(this.activate, this); // makes subscription reactive
			return;
		}
		SubscriptionManager.Promotions();
	};
	
	this.npName = ko.observable();
	this._npStartDate = ko.observable();
	this.npStartDate = ko.computed(function() {
		return moment(this._npStartDate(), "YYYY-MM-DD");
	}.bind(this));

	this._npEndDate = ko.observable();
	this.npEndDate = ko.computed(function() {
		return moment(this._npEndDate(), "YYYY-MM-DD");
	}.bind(this));

	this.npType = ko.observable();
	
	this.npProduct = ko.observable();
	this.npM = ko.observable();
	this.npN = ko.observable();
	this.npP = ko.observable();
	
	this.npNameValid = ko.computed(function() {
		return this.npName();
	}.bind(this));
	
	this.npStartDateValid = ko.computed(function() {
		var d = this.npStartDate();
		return d && d.isValid();
	}.bind(this));

	this.npEndDateValid = ko.computed(function() {
		var d = this.npEndDate();
		return d && d.isValid();
	}.bind(this));

	this.npTypeValid = ko.computed(function() {
		return this.npType();
	}.bind(this));
	
	this.npProductValid = ko.computed(function() {
		return this.npProduct();
	}.bind(this));
	
	this.npMValid = ko.computed(function() {
		return this.npM();
	}.bind(this));
	
	this.npNValid = ko.computed(function() {
		return this.npN();
	}.bind(this));
	
	this.npPValid = ko.computed(function() {
		var p = parseInt(this.npP());
		return p > 0 && p < 100;
	}.bind(this));
	
	this.npDetailValid = ko.computed(function() {
		if (this.npType() == "mxn") {
			return this.npProductValid() && this.npMValid() && this.npNValid();
		} else if (this.npType() == "percentage") {
			return this.npProductValid() && this.npPValid();
		}
	}.bind(this));
	
	this.canCreatePromotion = ko.computed(function() {
		return this.npNameValid() && this.npStartDateValid() 
			&& this.npEndDateValid() && this.npTypeValid()
			&& this.npDetailValid();
	}.bind(this));
	
	this.createPromotion = function() {
		var promo = {
			name: this.npName(),
			startDate: this.npStartDate().toDate(),
			endDate: this.npEndDate().toDate(),
			type: this.npType()
		};
		
		if (this.npType() == "mxn") {
			promo.productId = this.npProduct();
			promo.m = this.npM();
			promo.n = this.npN();
		} else if (this.npType() == "percentage") {
			promo.productId = this.npProduct();
			promo.p = this.npP();
		} else {
			throw "Type not handled: "+this.npType();
		}
		
		this.npName(null);
		this._npStartDate(null);
		this._npEndDate(null);
		this.npType(null);
		this.npProduct(null);
		this.npM(null);
		this.npN(null);
		this.npP(null);
		$(".product-input").val("");
		
		Meteor.call("createPromotion", promo);
	}.bind(this);
	
	this.productName = function(id) {
		id = ""+id;
		var p = Products.findOne(id);
		return p ? p.name : "#"+id;
	}.bind(this);
	
	this.findProducts = function(s) {
		if (! s || s.length < 2) return [];
		s = removeDiacritics(s).toUpperCase().split(" ");
		if (s.length == 0) return [];
		
		var match = function(text) {
			if (! text) return false;
		
			text = removeDiacritics(text).toUpperCase();
			for(var i=0;i<s.length;i++) {
				var t = s[i];
				if (t.length > 0 && text.indexOf(t) == -1) return false;
			}
			return true;
		};
		
		var result = [];
		Products.find({}).forEach(function(p) {
			if (match(p.name)) result.push({ label: p.name, value: p._id });
		});
		return result;
	}.bind(this);
	
	this.productAutocompleteFilter = function(request, response) {
		var text = request.term;
		var products = this.findProducts(text);
		response(products);
	}.bind(this);
}

Template.promotions.rendered = function() {
	$(".datepicker").datepicker({
		dateFormat: "yy-mm-dd"
	});
	
	/*$(".product-input").autocomplete({
		source: view.productAutocompleteFilter,
		select: function(event, ui) {
			var id = ui.item.value;
			view.npProduct(id);
			event.preventDefault();
			$(event.target).val(ui.item.label);
		}
	});*/
};

