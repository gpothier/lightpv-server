Meteor.startup(function() {
	console.log("Running migrations");
	try {
		Migrations.migrateTo("latest");
	} catch (e) {
		logger.error("Migration failed: "+e);
		Migrations._collection.update({_id:"control"}, {$set:{"locked":false}});
	}
});
