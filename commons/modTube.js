var childP = require('child_process');
var wractorJs = require.resolve('./wractor.js');
var events = require('events');

module.exports = (function (process) {

//	var MESSAGE_TYPES = [
//		"TRX", // Transactional
//		"NOR", // No Response - rumor
//		"REQ", // Request a message
//		"DIE", // a die notification (it self or other)
//		"CMP", // Control message ping
//		"CMD" // Command
//	];
	var Wractor = (function (name) {

		var tube = this;
		var spawned = tube.wractors[name];

		var __self = {
			self : function () {
				return spawned;
			},
			send : function (sender, msg, callback) {
				var message = {
					sender: sender,
					sendee: name,
					value : msg,
					type  : 0 // TRX
				};
				spawned.send(JSON.stringify(message));
				if (typeof callback === "function") {
					process.nextTick(callback.bind(null, message));
				}
				return tube;
			},
			rumor: function (msg, callback) {
				var message = {
					sender: null,
					sendee: name,
					value : msg,
					type  : 1 // NOR
				};
				spawned.send(JSON.stringify(message));
				if (typeof callback === "function") {
					process.nextTick(callback.bind(null, message));
				}
				return tube;
			},
			query: function (sender, query, callback) {
				var message = {
					sender: sender,
					sendee: name,
					value : query,
					type  : 2 // REQ
				};
				spawned.send(JSON.stringify(message));
				if (typeof callback === "function") {
					process.nextTick(callback.call(null, message));
				}
				return tube;
			},
			die  : function (sender, message, callback) {
				var message = {
					sender: sender,
					sendee: name,
					value : message,
					type  : 3 // DIE
				};
				spawned.send(JSON.stringify(message));
				if (typeof callback === "function") {
					process.nextTick(callback.call(null, message));
				}
				return tube;
			},
			ping : function (sender, callback) {
				var message = {
					sender: sender,
					sendee: name,
					value : "PING " + Date.now(),
					type  : 4 // CMP
				};
				spawned.send(JSON.stringify(message));
				if (typeof callback === "function") {
					process.nextTick(callback.call(null, message));
				}
				return tube;
			},
			exec : function (sender, command, args, callback) {
				if (typeof arg !== "object" && typeof args === "function" && !callback)
					callback = args;
				var message = {
					sender: sender,
					sendee: name,
					value : JSON.stringify({
						command: command,
						args   : args
					}),
					type  : 5 // CMP
				};
				spawned.send(JSON.stringify(message));
				if (typeof callback === "function") {
					process.nextTick(callback.call(null, message));
				}
				return tube;
			},
			exit : function (callback) {
				if (typeof callback === "function") {
					process.nextTick(callback.call(null, message));
				}
				return tube;
			}
		};
		return __self;
	});


	/**
	 *
	 * @param callback
	 * @returns {*}
	 * @constructor
	 */
	function Tube(callback) {
		//this.messageQueue = [];
		this.wractors = {};
		this.callback = callback || (function () {});
		return this;
	}

	// inherit
	(function (father) {
		// I am your Father!
		this.prototype = father;
		return this;
	}).call(Tube, new events.EventEmitter());

	// channel's backbone
	Tube.prototype.on("spawn",function (thisFork, name) {
		//console.log("Has Spawned: ", name);
	}).on("message",function (thisChild, message) {
			var obj = JSON.parse(message);
			if (obj.sendee === "master") {
				this.handle(obj);
				return;
			}
			this.forpass(obj);
		}).on("error",function (thisChild, message) {
			this.handle({
				sender : thisChild.name,
				message: message,
				type   : -1
			});
		}).on("exit", function (thisChild, path, message) {
			this.handle({
				sender : thisChild.name,
				message: message,
				path   : path,
				type   : -2
			});
		});

	/**
	 *
	 * @param message
	 * @returns {*}
	 */
	Tube.prototype.forpass = function (message) {
		if (typeof this.wractors[message.sendee] === "undefined") {
			throw "Wractor " + message.sendee + " doesn't exist.";
		}
		Wractor.call(this, message.sendee).send(message.sender, message.value);
		return this;
	};

	/**
	 *
	 * @param message
	 * @returns {*}
	 */
	Tube.prototype.handle = function (message) {
		switch (message.type) {
			case -2: // Actor Exit
				this.callback.call(this, message);
				break;
			case -1: // Actor Error
				this.callback.call(this, message);
				break;
			case 0: // Actor Message TRX
				this.callback.call(this, message);
				break;
			case 1: // Actor Message NOR
				this.callback.call(this, message);
				break;
			case 2: // Actor REQ
				this.callback.call(this, message);
				break;
			case 3: // DIE a die notification (it self or other)
				this.callback.call(this, message);
				break;
			case 4: // CMP Control message ping
				this.callback.call(this, message);
				break;
			case 5: // CMD Actor's Command to master
				this.callback.call(this, message);
				break;
			default:
				this.callback.call(this, message);
				break;
		}
		return this;
	};

	/**
	 *
	 * @param wractor
	 * @param path
	 * @param callback
	 * @returns {Function}
	 */
	Tube.prototype.spawn = function (wractor, path, callback) {
		if (typeof this.wractors[wractor] !== "undefined") {
			throw "Wractor " + wractor + " already exist.";
		}

		var arr = process.execArgv.concat([wractorJs], __args(arguments).slice(2) || []);
		var child = childP.spawn(process.execPath, arr, {
			env       : process.env,
			cwd       : process.cwd(),
			execPath  : process.execPath,
			stdio     : ['pipe', 1, 'pipe', 'ipc', 'pipe', 'pipe'],
			killSignal: 'SIGTERM',
			timeout   : 0,
			encoding  : 'utf8',
			maxBuffer : 200 * 1024
		});

		child.name = wractor;
		child.send(JSON.stringify({
			path: path,
			name: wractor
		}));
		child.on('message', this.emit.bind(this, "message", this.child));
		child.on('data', this.emit.bind(this, "message", this.child));
		child.on('request', this.emit.bind(this, "request", this.child));
		child.on('ping', this.emit.bind(this, "ping", this.child));
		child.on('command', this.emit.bind(this, "command", this.child));
		child.on('error', this.emit.bind(this, "error", this.child));
		child.on('die', this.emit.bind(this, "exit", this.child));
		child.on('exit', this.emit.bind(this, "exit", this.child, path));
		child.on('close', this.emit.bind(this, "exit", this.child, path));
		for (var fd in child.stdio) {
			if (child.stdio[fd] !== null) {
				child.stdio[fd].on('data', this.emit.bind(this, "message", child));
			}
		}
		this.wractors[wractor] = child;
		var __this = this;
		process.nextTick(function () {
			__this.emit("spawn", __this, wractor, __this.wractors[wractor]);
		});
		if (typeof callback === "function") {
			process.nextTick(callback.bind(__this, wractor, __this.wractors[wractor]));
		}
		return Wractor.call(this, wractor);
	};

	/**
	 *
	 * @param wractor
	 * @returns {Function}
	 */
	Tube.prototype.of = function (wractor) {
		if (typeof this.wractors[wractor] === "undefined") {
			throw "Wractor " + wractor + " seems to be absent.";
		}
		return Wractor.call(this, wractor);
	};

	/**
	 *
	 * @param callback
	 * @returns {*}
	 */
	Tube.prototype.exitAll = function (callback) {
		for (var name in this.wractors) {
			try {
				this.wractors[name].kill('SIGHUP');
			}
			catch (e) {

			}
		}
		if (typeof callback === "function") {
			process.nextTick(callback.apply(null));
		}
		return this;
	};

	return Tube;
})(process);

function __args(arg) {
	var arr = [];
	for (var i = 0; i < arg.length; ++i) {
		arr.push(arg[i]);
	}
	return arr;
}