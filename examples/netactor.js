module.exports = function (wractor, name, path) {

	wractor.on("serve", function (message, servable) {
		servable.on('connection', function (socket) {
			socket.setEncoding("utf8");
			socket.setNoDelay(true);
			socket.on('data', function (data) {
				//console.log(name, Date.now());
				socket.end('handled by ' + name + "\n" + data);
			});
		});
	});
	wractor.on("message", function (mId, sender, message, type) {
		//console.log(process.pid, "Received: ", mId, sender, type);
		wractor.ahead(message);
	});
	wractor.on("request", function (mId, sender, message, type) {
		//console.log(name, Date.now());
		wractor.reply(mId, sender, name);
	});
	wractor.on("die", function () {
		process.exit();
	});
	wractor.on("ping", function (mId, sender, message, type) {
		wractor.pong();
	});
	wractor.on("command", function (mId, sender, message, type) {

	});
	//wractor.ahead(message);
	//wractor.request(sender, message, function (err, message) { });
};
