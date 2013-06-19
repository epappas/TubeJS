var assert = require("assert");
var tubeJs = require('../index.js');

module.exports.setUp = function (callback) {callback();};
module.exports.tearDown = function (callback) {callback();};
module.exports.group = {
	dummy  : function (test) {
		test.ok(true);
		test.done();
	},
	testing: function (test) {
		test.ok(true);
		var channel = new tubeJs(function (tube) {
			tube.on("message",function (message) {
				assert.notEqual(message, null);
				assert.notEqual(message.messageId, null);
				assert.notEqual(message.value, null);
				assert.equal(message.value.success, true);
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

		channel.spawn("testee", require.resolve("./testee.js"));

		channel.of("testee").spawn("tester", require.resolve("./tester.js"), function (messageId, target, child) {
			assert.notEqual(child, null);
			assert.notEqual(messageId, null);
			assert.equal(target, "testee");
			console.log("SPAWN:", messageId, target, Date.now());

			channel.of("testee").send("master", "tester", function (messageId, target, message) {
				assert.notEqual(message, null);
				assert.notEqual(messageId, null);
				assert.notEqual(message.value, null);
				assert.equal(target, "testee");
				assert.equal(message.type, 0);
				assert.equal(message.sendee, "testee");
				assert.equal(message.value, "tester");
				console.log("SEND:", message.messageId, message.value, Date.now());
			});

			channel.of("tester").query("master", "testee", function (err, message) {
				assert.notEqual(message, null);
				assert.equal(message.target, "tester");
				assert.deepEqual(message.reply, { test: 'reply', success: true });
				console.log("QUERY: ", message.messageId, message.reply.test, Date.now());
				test.done();
			});
		});
	}
};