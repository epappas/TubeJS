var uuid = require("../commons/modUUID.js");
var events = require('events');
var hex = uuid(16);
var hexUuid = new hex('xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');
var mainFunc = null;

var wrapper = (function (process) {
	var process = process;

	function Wrapper() {

		this.process = process;
		this.name = "";
		this.path = "";
		this.afterMe = [];
		this.children = [];
		this.mailBox = {};
		//this.mailBoxQ = [];
		this.lastMID = "";
		return this;
	}

	// inherit
	(function (father) {
		// I am your Father!
		this.prototype = father;
		return this;
	}).call(Wrapper, new events.EventEmitter());

	/**
	 * Handle message logic
	 * @param message
	 * @returns {*}
	 */
	Wrapper.prototype.handle = function (message) {
		var obj = JSON.parse(message);
		if (this.mailBox[obj.messageId]) {
			var cb = this.mailBox[obj.messageId].callback;
			cb(null, {
				messageId: obj.messageId,
				request  : this.mailBox[obj.messageId].message,
				target   : this.mailBox[obj.messageId].target,
				reply    : obj.value,
				sender   : obj.sender
			});
			delete this.mailBox[obj.messageId];
			return this;
		}
		switch (obj.type) {
			case -2: // Actor Exit
				break;
			case -1: // Actor Error
				break;
			case 0: // TRX
				this.emit.apply(this, ["message", obj.messageId, obj.sender, obj.value, obj.type]);
				break;
			case 1: // NOR
				this.emit.apply(this, ["message", obj.messageId, null, obj.value, obj.type]);
				break;
			case 2: // REQ
				this.emit.apply(this, ["request", obj.messageId, obj.sender, obj.value, obj.type]);
				break;
			case 3: // DIE
				this.emit.apply(this, ["die", obj.messageId, obj.sender, obj.value, obj.type]);
				break;
			case 4: // CMP
				this.emit.apply(this, ["ping", obj.messageId, obj.sender, obj.value, obj.type]);
				break;
			case 5: // CMD
				this.emit.apply(this, ["command", obj.messageId, obj.sender, obj.value, obj.type]);
				break;
			case 6: // SPN
				this.emit.apply(this, ["spawn", obj.messageId, obj.sender, obj.value, obj.type]);
				break;
			case 7: // TUB
				this.emit.apply(this, ["tube", obj.messageId, obj.sender, obj.value, obj.type]);
				break;
			default:
				this.emit.apply(this, ["unknown", obj.messageId, obj.sender, obj.value, obj.type]);
				break;
		}
		return this;
	};

	/**
	 * Pass message to the next of topology
	 * @param message
	 * @param type
	 * @returns {*}
	 */
	Wrapper.prototype.ahead = function (message, type) {
		for (var i = this.afterMe.length; i--;) {
			if (this.afterMe[i]) {
				this.send(this.afterMe[i], message, type);
			}
		}
		return this;
	};

	Wrapper.prototype.spawn = function (wractor, path, callback) {
		this.send("master", {
			wractor: wractor,
			path   : path
		}, 6);
		this.children.push(wractor);
		return this;
	};

	Wrapper.prototype.lastMessageId = function () {
		return this.lastMID;
	};

	/**
	 * Tells master to pass this message to the target
	 * @param target
	 * @param message
	 * @param type
	 * @returns {*}
	 */
	Wrapper.prototype.send = function (target, message, type) {
		var mId = hexUuid.get();
		this.process.send(JSON.stringify({
			messageId: mId,
			sender   : this.name,
			sendee   : target,
			value    : message,
			type     : type || 0
		}));
		this.lastMID = mId;
		return this;
	};

	Wrapper.prototype.request = function (target, message, callback) {
		var mId = hexUuid.get();
		this.process.send(JSON.stringify({
			messageId: mId,
			sender   : this.name,
			sendee   : target,
			value    : message,
			type     : 2
		}));
		this.lastMID = mId;

		this.mailBox[mId] = {
			messageId: mId,
			message  : message,
			target   : target,
			callback : (callback || function () {} )
		};
		//this.mailBoxQ.push(mId);
		return this;
	};

	return new Wrapper(); // Thread local singleton
})(process);

// a cool hack :)
var func = init;
function init(message) {
	try {
		var obj = JSON.parse(message);
		wrapper.name = obj.name;
		wrapper.path = obj.path;
		mainFunc = require(obj.path).bind(wrapper); // actor is fetched
		mainFunc.apply(wrapper, [wrapper, wrapper.name, wrapper.path].concat(__args(arguments)));
	}
	catch (e) {
		console.error(e);
	}
	// a cool hack; handler will be the function that will process
	// each incoming message after this initiation
	func = handler;
}

function handler() {
	return wrapper.handle.apply(wrapper, [].concat(__args(arguments)));
}

process.on("message", function () {
	if (arguments[0] === 'exit') {
		process.exit(0);
	}
	try {
		func.apply(this, arguments);
	}
	catch (e) {
		console.error(e);
	}
});

function __args(arg) {
	var arr = [];
	for (var i = 0; i < arg.length; ++i) {
		arr.push(arg[i]);
	}
	return arr;
}

