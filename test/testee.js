module.exports = function (wractor, name, path) {
	wractor.send("master", {
		pid    : process.pid,
		name   : name,
		path   : path,
		test   : "masterspawn",
		success: true
	});
	wractor.on("message", function (mId, sender, message, type) {
		if (wractor.afterMe.length > 0) {
			wractor.ahead(message);
		}
	});
	wractor.on("request", function (mId, sender, message, type) {
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
