module.exports = function(wractor, name, path) {
	console.log("CPID: "+ process.pid);
	console.log("Child name & Path: ", name, path);

	wractor.on("message", function(mId, sender, message, type) {
		console.log("Child Received: ", mId, sender, message, type);
		wractor.send(sender, message);
	});
	wractor.on("request", function(mId, sender, message, type) {
		console.log("Child Received: ", mId, sender, message, type);
		wractor.reply(mId, sender, message);
	});
};
