var tubeJs = require('../index.js');
var rl = require('readline');
var events = require('events');
var path = require("path");

var __this = this;
var pwd = __dirname;
var commands = {};

var flow = new events.EventEmitter();
var i = rl.createInterface(process.stdin, process.stdout, null);

var channel = new tubeJs(function (tube) {
	tube.on("message",function (message) {
		console.log(message);
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

process.nextTick((function main() {
	i.question("tubeJS> ", function (answer) {
		__processQuery(answer, main.bind(__this));
	});
}).bind(__this));

// init
(function () {
	commands = {
		spawn: {
			name       : "SPAWN",
			minArgs    : 3,
			argDesc    : "<name> <path>",
			description: "\t\t\t\tSpawns a new actor with the given path.",
			func       : function (callback, wractor, path) {
				flow.emit("spawn", callback, wractor, path);
			}
		},
		send : {
			name       : "SEND",
			minArgs    : 4,
			argDesc    : "<sender> <target> <message>",
			description: "\tSends a message to the target actor in behalf of the sender actor.",
			func       : function (callback, sender, target, message) {
				flow.emit("send", callback, sender, target, message);
			}
		},
		rumor: {
			name       : "RUMOR",
			minArgs    : 3,
			argDesc    : "<target> <message>",
			description: "\t\t\tSends an anonymous message to the target actor.",
			func       : function (callback, wractor, message) {
				flow.emit("rumor", callback, wractor, message);
			}
		},
		query: {
			name       : "QUERY",
			minArgs    : 4,
			argDesc    : "<requester> <target> <query>",
			description: "Queries the target actor in behalf of the requester.",
			func       : function (callback, wractor, target, query) {
				flow.emit("query", callback, wractor, target, query);
			}
		},
		die  : {
			name       : "DIE",
			minArgs    : 2,
			argDesc    : "<actor> [<reason>]",
			description: "\t\t\tKills a running actor. The reason is optional.",
			func       : function (callback, wractor, reason) {
				flow.emit("die", callback, wractor, reason);
			}
		},
		ping : {
			name       : "PING",
			minArgs    : 2,
			argDesc    : "<actor>",
			description: "\t\t\t\t\t\tPings an actor.",
			func       : function (callback, wractor) {
				flow.emit("ping", callback, wractor);
			}
		},
		exec : {
			name       : "EXEC",
			minArgs    : 3,
			argDesc    : "<actor> <command> [<args>]",
			description: "\tThe actor executes the given command.",
			func       : function (callback, wractor, command, args) {
				flow.emit("exec", callback, wractor, command, args);
			}
		},
		tube : {
			name       : "TUBE",
			minArgs    : 3,
			argDesc    : "<inActor> <outActor>",
			description: "\t\tConnect both actors, so any forwarded message from inActor is received by outActor.",
			func       : function (callback, inActor, outActor) {
				flow.emit("tube", callback, inActor, outActor);
			}
		},
		exit : {
			name       : "EXIT",
			minArgs    : 1,
			argDesc    : "",
			description: "\t\t\t\tExits.",
			func       : function (callback) {
				flow.emit("exit", callback);
			}
		},
		help : {
			name       : "HELP",
			minArgs    : 1,
			argDesc    : "\t\t",
			description: "\t\t\t\t\tPrints this text.",
			func       : function (callback) {
				flow.emit("help", callback);
			}
		},
		pwd  : {
			name       : "PWD",
			minArgs    : 1,
			argDesc    : "\t\t",
			description: "\t\t\t\t\tCurrent working directory.",
			func       : function (callback) {
				flow.emit("pwd", callback);
			}
		}
	}
})();

function __processQuery(query, callback) {
	var args = query.split(" ");
	if (args.length < 1) {
		console.error("Bad query: ", query);
		flow.emit('help', callback, true);
		return;
	}
	if (!commands[args[0].toLowerCase()]) {
		console.error("Command Not exists: ", query);
		flow.emit('help', callback, true);
		return;
	}
	if (commands[args[0].toLowerCase()] <= args.length) {
		console.error("Not enough arguments supplied: ", query);
		flow.emit('help', callback, true);
		return;
	}
	commands[args[0].toLowerCase()].func.apply(__this, [callback].concat(args.slice(1)));
}

flow.on('spawn', function (callback, wractor, file) {
	channel.spawn(wractor, require.resolve(path.join(pwd, file)));
	if (typeof callback === "function") {
		setTimeout(callback, 200);
	}
});

flow.on('send', function (callback, sender, target, message) {
	channel.of(target).send(sender, message, function (messageId, target, message) {
		console.log(messageId + "@" + target);
	});
	if (typeof callback === "function") {
		setTimeout(callback, 200);
	}
});

flow.on('rumor', function (callback, target, message) {
	channel.of(target).rumor(message, function (messageId, message) {
		console.log(messageId);
	});
	if (typeof callback === "function") {
		setTimeout(callback, 200);
	}
});

flow.on('query', function (callback, sender, target, query) {
	channel.of(target).query(sender, query, function (messageId, target, query) {
		console.log(messageId + "@" + target);
	});
	if (typeof callback === "function") {
		setTimeout(callback, 200);
	}
});

flow.on('die', function (callback, wractor, reason) {
	channel.of(wractor).die("master", reason, function (messageId, target, reason) {
		console.log(messageId + "@" + target);
	});
	if (typeof callback === "function") {
		setTimeout(callback, 200);
	}
});

flow.on('ping', function (callback, wractor) {
	channel.of(wractor).ping("master", function (messageId, target) {
		console.log(messageId + "@" + target);
	});
	if (typeof callback === "function") {
		setTimeout(callback, 200);
	}
});

flow.on('exec', function (callback, wractor, command, args) {
	channel.of(wractor).exec("master", command, args, function (messageId, target) {
		console.log(messageId + "@" + target);
	});
	if (typeof callback === "function") {
		setTimeout(callback, 200);
	}
});

flow.on('tube', function (callback, inActor, outActor) {
	channel.of(inActor).tube(outActor, function (messageId, target) {
		console.log(messageId + "@" + target);
	});
	if (typeof callback === "function") {
		setTimeout(callback, 200);
	}
});

flow.on('exit', function (callback) {
	process.exit();
});

flow.on('help', function (callback, isError) {
	var print = console.log.bind(console);
	if (isError) {
		print = console.error.bind(console);
	}

	for (var c in commands) {
		print("\t" + commands[c].name + " \t" +
			(commands[c].argDesc ? commands[c].argDesc : "\t\t\t") +
			"\t\t" + commands[c].description);
	}

	if (typeof callback === "function") {
		setTimeout(callback, 100);
	}
});

flow.on('pwd', function (callback) {
	console.log(pwd);
	if (typeof callback === "function") {
		setTimeout(callback, 100);
	}
});