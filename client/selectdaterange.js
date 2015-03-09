// Select date range
selectDateRangeDialog = function() {
	selectDateRangeDialogViewModel.since(null);
	selectDateRangeDialogViewModel.until(null);
	
	AntiModals.overlay("selectDateRange", {
		modal: true,
	});
};

function SelectDateRangeDialogViewModel() {
	this.since = ko.observable();
	this.until = ko.observable();
	
	this.canConfirm = ko.computed(function() {
		var since = moment(this.since(), "YYYY-MM-DD");
		var until = moment(this.until(), "YYYY-MM-DD");
		return since.isValid() && until.isValid();
	}.bind(this));
	
	this.confirm = function() {
		var since = moment(this.since(), "YYYY-MM-DD").toDate();
		var until = moment(this.until(), "YYYY-MM-DD").toDate();
		since.setHours(0, 0, 0, 0);
		until.setHours(23, 59, 59, 999);

		Session.set("filter_date", [since, until]);
		AntiModals.dismissOverlay($("#select-date-range-dialog"), null, null); 
	}.bind(this);
	
	this.cancel = function() {
        AntiModals.dismissOverlay($("#select-date-range-dialog"), null, null);
	}.bind(this);
}

Meteor.startup(function() {
	selectDateRangeDialogViewModel = new SelectDateRangeDialogViewModel();
	
});

Template.selectDateRange.rendered = function() {
	ko.applyBindings(selectDateRangeDialogViewModel, $("#select-date-range-dialog")[0]);
	
	$(".datepicker").datepicker({
		dateFormat: "yy-mm-dd"
	});
	
};

