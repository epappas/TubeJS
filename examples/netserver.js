var server = require('net').createServer();
var tubeJs = require('../index.js');

var MAX_ACTORS = 2;
var robinBucket = [];
var cursor = 0;

var channel = new tubeJs(function (tube) {
	tube.on("message",function (message) {
		console.log("REPORT: ", message.messageId, message.value.test, Date.now());
	}).on("request",function (message) {
			console.log(message);
		}).on("die",function (message) {
			// DIE a die notification
			console.log(message);
		}).on("command",function (message) {
			// CMD Actor's Command to master
			console.log(message);
		}).on("reply",function (message) {
			console.log(message);
		}).on("unknown", function (message) {
			console.log(message);
		});
});
for (var i = 0; i < MAX_ACTORS; ++i) {
	robinBucket.push("netactor" + i);
	channel.spawn("netactor" + i, require.resolve("./netactor.js"));
}
for (var i = 0; i < MAX_ACTORS; ++i) {
	channel.spawn("netact" + i, require.resolve("./netactor.js"));
}
server.on('connection', function (socket) {
	socket.setEncoding("utf8");
	socket.setNoDelay(true);
	var c = cursor = ++cursor % MAX_ACTORS;
	socket.on('data', function (data) {
		channel.of(robinBucket[c]).query("master", data, function (err, message) {
			socket.end(message.reply);
		});
	});
});
server.listen(9687, function () {
	console.log("listening on 9687");
	for (var i = 0; i < MAX_ACTORS; ++i) {
		channel.of("netact" + i).serve("server", server);
	}
});