var winston = Meteor.npmRequire("winston");

logger = new (winston.Logger)({
	transports: [new (winston.transports.Console)({ timestamp: true })]
});

