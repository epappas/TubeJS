var tubeJs = require('../index.js');
var channel = new tubeJs(function (tube) {
	tube.on("message",function (message) {
		// messageId != null
		// message.value === {test: '...', success: true}
		console.error(message);
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

channel.spawn("testee", require.resolve("./testee.js"));

setTimeout(function () {
	channel.of("testee").spawn("tester", require.resolve("./tester.js"), function () {
		// messageId != null
		// target === "testee"
		// message.type === 6
		// message.sendee === "testee"
		// message.value === {wractor: 'tester', path: require.resolve("./tester.js")}
	});
}, 200);
setTimeout(function () {
	channel.of("testee").send("master", "tester", function (messageId, target, message) {
		// messageId != null
		// target === "testee"
		// message.type === 0
		// message.sendee === "testee"
		// message.value === "tester"
	});
}, 400);
setTimeout(function () {
	channel.of("tester").query("master", "testee", function (messageId, target, message) {
		// messageId != null
		// target === "tester"
		// message.type === 2
		// message.sendee === "tester"
		// message.value === "testee"
	});
}, 600);