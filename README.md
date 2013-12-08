Tube JS (v 0.1.0)
==========================

A prototype port of Scala actors to NodeJS. A lightweight asynchronous concurrent messaging.

Before you keep reading further you shall be aware as this project is still in its prototype version and unstable.
Future releases will make this library ready to be used in a production manner.

## Getting Started ##

Example: <br/>

    var tubeJs = require('tubeJs');
    var channel = new tubeJs();

    channel.spawn("wractor1", "/absolute/path/to/wractor/module");
    channel.spawn("wractor2", require.resolve("./relative/path/yourWractor.js"));

At yourWractor.js:

    module.exports = function(wractor, name, path) {
    	console.log("CPID: "+ process.pid);
    	console.log("Actor name & Path: ", name, path);
    	wractor.on("serve", function (message, servable) {
			servable.on('connection', function (socket) {
				socket.setEncoding("utf8");
				socket.setNoDelay(true);
				socket.on('data', function (data) {
					socket.end('handled by ' + name + "\n" + data);
				});
			});
		});
    	wractor.on("message", function (mId, sender, message, type) {
			console.log(process.pid, "Received: ", mId, sender, type);
			wractor.ahead(message); // pass this message to the children of this wractor
		});
		wractor.on("request", function (mId, sender, message, type) {
			console.log(process.pid, "Requested: ", mId, sender, type);
			wractor.reply(mId, sender, "The result of your query");
		});
		wractor.on("die", function () {
			process.exit();
		});
		wractor.on("ping", function (mId, sender, message, type) {
			wractor.pong(); // someone (sender) checked if I am alive
		});
		wractor.on("command", function (mId, sender, message, type) {
			// command type message do something with the `message`
		});
    }

Send messages from Master to an wractor:

    channel.of("wractor1").send("master", "Hello World", function (messageId, target, message) {
		// this callback will fire as soon as the wractor will get this message
	});

Then `wractor1` will receive `"Hello World"` as message.

Request/Query actors:

	channel.of("wractor1").query("master", "What's the weather like?", function (err, message) {
		// this callback will fire ass soon as a .reply() will be called
		// the `message` holds the message.reply of the wractor
	});

Ask wractor to spawn a new wractor as its child:

	channel.of("wractor1").spawn("wractor", "path/of/new/wractor.js", function (messageId, target, child) {
		// will fire as soon as the new wractor will be spawned.
		// `child` holds the child process
		// `target` the name of the wractor, should be === "wractor"
	});

Ask wractor to serve a servable resource like `require('net').createServer()` or a `socket`:

	var server = require('net').createServer();
	server.listen(6789, function () {
		channel.of("wractor").serve("server", server);
	});
	// or
	server.on('connection', function (socket) {
		socket.setEncoding("utf8");
		socket.setNoDelay(true);
		socket.on('data', function (data) {
			channel.of("wractor").query("master", data, function (err, message) {
				socket.end(message.reply);
			});
		});
		// or
		channel.of("actor3").serve("socket", socket);
	});

## Local Wractors

If a Wractor module is implemented with no violations to the prototype structure, it should operate using 
the `.place()` method localy withoud `.spawn()`ing a new thread. `.place()` creates local wractors operating
with their own scope, and operate exacly as threaded wractors. As a result a wractor module shouldn't be aware
either it's spawned or not. This gives the advantage of having runing services within one Node.js instance.

Example of Use:

	channel.place("localwractor", function (wractor, name, path) {
		console.log("LOCAL: ", name);

		wractor.request("wractor3", "LOCAL QUERY TEST:"+Date.now(), function(err, reply) {
			console.log("LOCAL REPLY 3: ", reply);
		});

		wractor.on("message", function (mId, sender, message, type) {
			console.log("LOCAL MESSAGE: ", message);
		});
		wractor.on("request", function (mId, sender, message, type) {
			wractor.reply(mId, sender, "Hey there");
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


Feel free to enjoy.

Cheers!