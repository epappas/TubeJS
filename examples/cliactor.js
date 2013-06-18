module.exports = function (wractor, name, path) {
	console.log("I'm spawned ", process.pid, name, path);

	wractor.on("message", function (mId, sender, message, type) {
		console.log("Child Received: ", mId, sender, message, type);
		//wractor.send(sender, message);
	});
	wractor.on("request", function (mId, sender, message, type) {
		console.log("Child Queried: ", mId, sender, message, type);
		wractor.reply(mId, sender, message);
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
