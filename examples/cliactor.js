module.exports = function(wractor, name, path) {
	console.log("CPID: "+ process.pid);
	console.log("Child name & Path: ", name, path);

	wractor.on("message", function(sender, message, type) {
		console.log("Child Received: ", sender, message, type);
		wractor.send(sender, message);
	});
	wractor.on("request", function(sender, message, type) {
		console.log("Child Received: ", sender, message, type);
		wractor.send(sender, message);
	});
};
