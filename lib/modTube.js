var childP = require('child_process');
var wractorJs = require.resolve('./wractor.js');
var events = require('events');
var uuid = require("../lib/modUUID.js");

module.exports = (function (process) {

	var hex = uuid(16);
	var hexUuid = new hex('xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');
//	var MESSAGE_TYPES = [
//		"TRX", // Transactional
//		"NOR", // No Response - rumor
//		"REQ", // Request a message
//		"DIE", // a die notification (it self or other)
//		"CMP", // Control message ping
//		"CMD", // Command
//		"SPN", // Spawn command
//		"TUB", // Tube command
//		"REP" // Reply message
//	];
	var Wractor = (function (name) {

		var tube = this;
		var spawned = tube.wractors[name];
		var messageId = null;

		var __self = {
			self  : function () {
				return spawned;
			},
			handle: function (message) {
				messageId = message.messageId;
				switch (message.type) {
					case 0: // Actor Message TRX
						this.send(message.sender, message.value);
						break;
					case 1: // Actor Message NOR
						this.rumor(message.sender);
						break;
					case 2: // Actor REQ
						this.query(message.sender, message.value);
						break;
					case 3: // DIE a die notification (it self or other)
						this.die(message.sender, message.value);
						break;
					case 4: // CMP Control message ping
						this.ping(message.sender);
						break;
					case 5: // CMD Actor's Command to master
						this.exec(message.sender, message.value);
						break;
					case 6: // SPN
						this.spawn(message.sender, message.value);
						break;
					case 7: // TUB
						this.tube(message.sender, message.value);
						break;
					case 8: // REP
						this.reply(message.sender, message.value);
						break;
					default:
						this.send(message.sender, message.value);
						break;
				}
				return tube;
			},
			send  : function (sender, msg, callback) {
				var mId = (messageId || hexUuid.get());
				var message = {
					messageId: mId,
					sender   : (sender || "master"),
					sendee   : name,
					value    : msg,
					type     : 0 // TRX
				};
				spawned.send(JSON.stringify(message));
				if (typeof callback === "function") {
					process.nextTick(callback.bind(null, mId, name, message));
				}
				return tube;
			},
			rumor : function (msg, callback) {
				var mId = (messageId || hexUuid.get());
				var message = {
					messageId: mId,
					sender   : null,
					sendee   : name,
					value    : msg,
					type     : 1 // NOR
				};
				spawned.send(JSON.stringify(message));
				if (typeof callback === "function") {
					process.nextTick(callback.bind(null, mId, name, message));
				}
				return tube;
			},
			query : function (sender, query, callback) {
				var mId = (messageId || hexUuid.get());
				var message = {
					messageId: mId,
					sender   : (sender || "master"),
					sendee   : name,
					value    : query,
					type     : 2 // REQ
				};
				spawned.send(JSON.stringify(message));
				if (message.sender === "master") {
					tube.mailBox[mId] = {
						messageId: mId,
						message  : message,
						target   : name,
						callback : (callback || function () {} )
					};
				}
				return tube;
			},
			die   : function (callback) {
				spawned.kill();
				delete tube.wractors[name];
				if (typeof callback === "function") {
					process.nextTick(callback.bind(null, name, "dead"));
				}
				return tube;
			},
			ping  : function (sender, callback) {
				var mId = (messageId || hexUuid.get());
				var message = {
					messageId: mId,
					sender   : (sender || "master"),
					sendee   : name,
					value    : "PING " + Date.now(),
					type     : 4 // CMP
				};
				spawned.send(JSON.stringify(message));
				if (message.sender === "master") {
					tube.mailBox[mId] = {
						messageId: mId,
						message  : message,
						target   : name,
						callback : (callback || function () {} )
					};
				}
				return tube;
			},
			exec  : function (sender, command, args, callback) {
				if (typeof arg !== "object" && typeof args === "function" && !callback)
					callback = args;
				var mId = (messageId || hexUuid.get());
				var message = {
					messageId: mId,
					sender   : (sender || "master"),
					sendee   : name,
					value    : {
						command: command,
						args   : args
					},
					type     : 5 // CMP
				};
				spawned.send(JSON.stringify(message));
				if (typeof callback === "function") {
					process.nextTick(callback.bind(null, mId, name, message));
				}
				return tube;
			},
			spawn : function (wractor, path, callback) {
				var mId = (messageId || hexUuid.get());
				var message = {
					messageId: mId,
					sender   : "master",
					sendee   : name,
					value    : {
						wractor: wractor,
						path   : path
					},
					type     : 6 // SPN
				};
				spawned.send(JSON.stringify(message));
				tube.spawn(wractor, path, function(err, child) {
					if (typeof callback === "function") {
						process.nextTick(callback.bind(null, mId, name, child));
					}
				}, mId);
				return tube;
			},
			tube  : function (wractor, callback) {
				var mId = (messageId || hexUuid.get());
				var message = {
					messageId: mId,
					sender   : "master",
					sendee   : name,
					value    : {
						wractor: wractor
					},
					type     : 7 // TUB
				};
				spawned.send(JSON.stringify(message));
				if (typeof callback === "function") {
					process.nextTick(callback.bind(null, mId, name, message));
				}
				return tube;
			},
			reply : function (sender, message, callback) {
				var mId = (messageId || hexUuid.get());
				var message = {
					messageId: mId,
					sender   : (sender || "master"),
					sendee   : name,
					value    : message,
					type     : 8 // REP
				};
				spawned.send(JSON.stringify(message));
				if (typeof callback === "function") {
					process.nextTick(callback.bind(null, mId, name, message));
				}
				return tube;
			},
			exit  : function (callback) {
				if (typeof callback === "function") {
					process.nextTick(callback.bind(null));
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
		this.pingMailBox = [];
		this.mailBox = {};
		this.handler = new events.EventEmitter();
		if (typeof callback === "function") {
			callback(this.handler);
		}
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
				sender : (thisChild || {}).name,
				message: message,
				type   : -1
			});
		}).on("exit", function (thisChild, path, message) {
			this.handle({
				sender : (thisChild || {}).name,
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
		//Wractor.call(this, message.sendee).send(message.sender, message.value, message.type);
		Wractor.call(this, message.sendee).handle(message);
		return this;
	};

	/**
	 *
	 * @param message
	 * @returns {*}
	 */
	Tube.prototype.handle = function (message) {
		if (this.mailBox[message.messageId]) {
			var cb = this.mailBox[message.messageId].callback;
			cb(null, {
				messageId: message.messageId,
				source   : this.mailBox[message.messageId].sendee,
				requester: message.sendee,
				request  : this.mailBox[message.messageId].message,
				target   : this.mailBox[message.messageId].target,
				reply    : message.value,
				sender   : message.sender
			});
			delete this.mailBox[message.messageId];
			return this;
		}
		switch (message.type) {
			case -2: // Actor Exit
				this.handler.emit("aexit", message);
				//this.callback.call(this, "aexit", message);
				break;
			case -1: // Actor Error
				this.handler.emit("aerr", message);
				//this.callback.call(this, "aerr", message);
				break;
			case 0: // Actor Message TRX
				this.handler.emit("message", message);
				//this.callback.call(this, "message", message);
				break;
			case 1: // Actor Message NOR
				this.handler.emit("message", message);
				//this.callback.call(this, "message", message);
				break;
			case 2: // Actor REQ
				this.handler.emit("request", message);
				//this.callback.call(this, "request", message);
				break;
			case 3: // DIE a die notification (it self or other)
				this.of(message.sender).die();
				this.handler.emit("die", message);
				//this.callback.call(this, "die", message);
				break;
			case 4: // CMP Control message ping
				this.pingMailBox.push(message);
				this.handler.emit("ping", message);
				//this.callback.call(this, "ping", message);
				break;
			case 5: // CMD Actor's Command to master
				this.handler.emit("command", message);
				//this.callback.call(this, "command", message);
				break;
			case 6: // SPN
				var req = message.value;
				this.spawn(req.wractor, req.path, null, message.messageId);
				this.handler.emit("spawn", message);
				//this.callback.call(this, "spawn", message);
				break;
			case 7: // TUB
				var req = message.value;
				this.of(message.sender).tube(req.wractor);
				this.handler.emit("tube", message);
				//this.callback.call(this, "tube", message);
				break;
			case 8: // REP
				this.handler.emit("reply", message);
				//this.callback.call(this, "reply", message);
				break;
			default:
				this.handler.emit("unknown", message);
				//this.callback.call(this, "unknown", message);
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
	Tube.prototype.spawn = function (wractor, path, callback, messageId) {
		if (typeof this.wractors[wractor] !== "undefined") {
			throw "Wractor " + wractor + " already exist.";
		}
		messageId = (messageId || hexUuid.get());

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

		this.mailBox[messageId] = {
			messageId: messageId,
			message  : wractor,
			target   : wractor,
			callback : function () {
				process.nextTick(function () {
					__this.emit("spawn", __this, wractor, __this.wractors[wractor]);
				});
				if (typeof callback === "function") {
					process.nextTick(callback.bind(__this, wractor, __this.wractors[wractor]));
				}
			}
		};

		child.name = wractor;
		child.send(JSON.stringify({
			path     : path,
			name     : wractor,
			messageId: messageId
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
	 * @returns {*}
	 */
	Tube.prototype.pong = function () {
		var __this = this;
		for (var i = this.pingMailBox.length; i--;) {
			(function () {
				__this.of(this.sender).handle({
					messageId: this.messageId,
					sender   : "master",
					sendee   : this.sender,
					value    : "PONG " + Date.now(),
					type     : 0
				});
			}).call(this.pingMailBox[i]);
		}
		return this;
	};

	/**
	 *
	 * @param callback
	 * @returns {*}
	 */
	Tube.prototype.exitAll = function (callback) {
		for (var name in this.wractors) {
			try {
				this.of(name).die();
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