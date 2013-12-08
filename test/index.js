var assert = require("assert");
var tubeJs = require('../index.js');

var channel = new tubeJs(function (tube) {
	tube.on("message",function (message) {
		assert.notEqual(message, null);
		assert.notEqual(message.messageId, null);
		assert.notEqual(message.value, null);
		assert.equal(message.value.success, true);
		console.log("MASTER REPORT: ", message.messageId, message.value.test, Date.now());
	}).on("request",function (message) {
			console.log("MASTER REQ REPORT: ", message);
		}).on("die",function (message) {
			// DIE a die notification
			console.log(message);
		}).on("command",function (message) {
			// CMD Actor's Command to master
			//console.log(message);
		}).on("reply",function (message) {
			//console.log(message);
		}).on("unknown", function (message) {
			//console.log(message);
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
		console.log("TESTEE SEND:", message.messageId, message.value, Date.now());
	});

	channel.of("tester").query("master", "testee", function (err, message) {
		assert.notEqual(message, null);
		assert.equal(message.target, "tester");
		assert.deepEqual(message.reply, { test: 'reply', success: true });
		console.log("TESTER REPLY: ", message.messageId, message.reply.test, Date.now());
	});
});

channel.place("localwractor", function (wractor, name, path) {
	console.log("LOCAL: ", name);
	assert.equal(name, "localwractor");

	wractor.request("localwractor", "LOCAL QUERY TEST:"+Date.now(), function(err, reply) {
		assert.equal(err, null);
		assert.notEqual(reply, null);
		console.log("LOCAL REPLY 3: ", reply);
	});

	wractor.on("message", function (mId, sender, message, type) {
		console.log("LOCAL MESSAGE: ", message);
		assert.notEqual(message, null);
	});
	wractor.on("request", function (mId, sender, message, type) {
		var __sender = sender;
		console.log("LOCAL REQUEST: ", mId, sender, message);
		process.nextTick(function () {
			wractor.reply(mId, __sender, { test: 'local reply', success: true });
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
});

channel.of("localwractor").send("master", "LOCAL TEST:"+Date.now());
channel.of("localwractor").query("localwractor", "LOCAL QUERY TEST:"+Date.now(), function(err, reply) {
	assert.equal(err, null);
	assert.notEqual(reply, null);
	console.log("LOCAL REPLY 1: ", reply);
});
channel.of("localwractor").query("master", "LOCAL QUERY TEST:"+Date.now(), function(err, reply) {
	assert.equal(err, null);
	assert.notEqual(reply, null);
	console.log("LOCAL REPLY 2: ", reply);
});


