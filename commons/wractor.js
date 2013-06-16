var events = require('events');
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
		this.mailBoxQ = [];
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
		switch (obj.type) {
			case -2: // Actor Exit
				break;
			case -1: // Actor Error
				break;
			case 0: // TRX
				this.emit.apply(this, ["message", obj.sender, obj.value, obj.type]);
				break;
			case 1: // NOR
				this.emit.apply(this, ["message", null, obj.value, obj.type]);
				break;
			case 2: // REQ
				this.emit.apply(this, ["request", obj.sender, obj.value, obj.type]);
				break;
			case 3: // DIE
				this.emit.apply(this, ["die", obj.sender, obj.value, obj.type]);
				break;
			case 4: // CMP
				this.emit.apply(this, ["ping", obj.sender, obj.value, obj.type]);
				break;
			case 5: // CMD
				this.emit.apply(this, ["command", obj.sender, obj.value, obj.type]);
				break;
			default:
				this.emit.apply(this, ["unknown", obj.sender, obj.value, obj.type]);
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

	/**
	 * Tells master to pass this message to the target
	 * @param target
	 * @param message
	 * @param type
	 * @returns {*}
	 */
	Wrapper.prototype.send = function (target, message, type) {
		this.process.send(JSON.stringify({
			sender: this.name,
			sendee: target,
			value : message,
			type  : type || 0
		}));
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
		wrapper.path = obj.path
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

