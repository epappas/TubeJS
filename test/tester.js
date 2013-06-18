module.exports = function (wractor, name, path) {
	wractor.send("master", { test: "spawn", success: true });
	wractor.on("message", function (mId, sender, message, type) {
		wractor.send("master", { test: "ahead", success: true });
	});
	wractor.on("request", function (mId, sender, message, type) {
		var __sender = sender;
		var testee = message;
		process.nextTick(function () {wractor.send(__sender, { test: "request", success: true });});
		process.nextTick(function () {
			wractor.ping(testee, function (err, message) {
				wractor.send(__sender, { test: "ping", success: true });
				process.nextTick(function () {wractor.reply(mId, __sender, { test: 'reply', success: true });});
			});
		});
	});
	wractor.on("die", function () {
		process.exit();
	});
	wractor.on("ping", function (mId, sender, message, type) {
		wractor.pong();
	});
};
