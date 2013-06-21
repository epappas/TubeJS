Tube JS (v 0.1.0)
==========================

A prototype port of Scala actors to NodeJS. A lightweight asynchronous concurrent messaging.

Before you keep reading further you shall be aware as this project is still in its prototype version and unstable.
Future releases will make this library ready to be used in a production manner.

## Getting Started ##

Example: <br/>

    var tubeJs = require('tubeJs');
    var channel = new tubeJs();

    channel.spawn("actor1", "/absolute/path/to/actor/module");
    channel.spawn("actor2", require.resolve("./relative/path/yourActor.js"));

At yourActor.js:

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

Send messages from Master to an actor:

    channel.of("actor1").send("master", "Hello World", function (messageId, target, message) {
		// this callback will fire as soon as the wractor will get this message
	});

Then `actor1` will receive `"Hello World"` as message.

Request/Query actors:

	channel.of("actor1").query("master", "What's the weather like?", function (err, message) {
		// this callback will fire ass soon as a .reply() will be called
		// the `message` holds the message.reply of the actor
	});

Ask actor to spawn a new actor as its child:

	channel.of("actor1").spawn("actor3", "path/of/new/wractor.js", function (messageId, target, child) {
		// will fire as soon as the new actor will be spawned.
		// `child` holds the child process
		// `target` the name of the actor, should be === "actor3"
	});

Ask actor to serve a servable resource like `require('net').createServer()` or a `socket`:

	var server = require('net').createServer();
	server.listen(6789, function () {
		channel.of("actor3").serve("server", server);
	});
	// or
	server.on('connection', function (socket) {
		socket.setEncoding("utf8");
		socket.setNoDelay(true);
		socket.on('data', function (data) {
			channel.of("actor3").query("master", data, function (err, message) {
				socket.end(message.reply);
			});
		});
		// or
		channel.of("actor3").serve("socket", socket);
	});

Feel free to enjoy.

Cheers!