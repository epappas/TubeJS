module.exports = function (wractor, name, path) {
	console.log("I'm spawned ", process.pid, name, path);
	var dummy = 0;
	wractor.on("message", function (mId, sender, message, type) {
		console.log(process.pid, "Received: ", mId, sender, type);
		wractor.ahead(message);
	});
	wractor.on("request", function (mId, sender, message, type) {
		console.log(process.pid, "Queried: ", mId, sender, type);
		wractor.reply(mId, sender, message);
		wractor.request(sender, message, function (err, message) {
			console.log("HERE!! ", arguments);
		});
	});
	wractor.on("die", function () {
		process.exit();
	});
	wractor.on("ping", function (mId, sender, message, type) {
		wractor.pong();
	});
	wractor.on("command", function (mId, sender, message, type) {

	});
};
