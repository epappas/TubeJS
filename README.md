Tube JS (v 0.0.1)
==========================

A prototype port of Scala actors to NodeJS. A lightweight asynchronous concurrent messaging.

Before we begin this project you shall be aware as this project is still in its prototype version and unstable. Future releases will make this library ready to be used in a production manner.

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

    	wractor.on("message", function(sender, message, type) {
    		console.log("Actor Received: ", sender, message, type);
    		wractor.send(sender, message);
    	});
    	wractor.on("request", function(sender, message, type) {
    		console.log("Actor is requested: ", sender, message, type);
    		wractor.send(sender, message);
    	});
    }

Send messages from Master to an actor:

    channel.of("actor1").send("master", "Hello World", function () {
    	console.log("Sent!");
    });

Then `actor1` will receive `"Hello World"` as message.

Feel free to enjoy.

Cheers!