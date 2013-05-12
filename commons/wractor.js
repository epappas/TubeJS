var events = require('events');
var mainFunc = null;

var wrapper = (function (process) {
	var process = process;

	function Wrapper() {

		this.process = process;
		return this;
	}

	// inherit
	(function (father) {
		// I am your Father!
		this.prototype = father;
		return this;
	}).call(Wrapper, new events.EventEmitter());

	Wrapper.prototype.handle = function(message) {
		var obj = JSON.parse(message);
		switch(obj.type) {
			case 0:
				this.emit.apply(this, ["message", obj.sender, obj.value, obj.type]);
				break;
			case 2:
				this.emit.apply(this, ["request", obj.sender, obj.value, obj.type]);
				break;
			default:
				this.emit.apply(this, ["message", obj.sender, obj.value, obj.type]);
				break;
		}
		return this;
	};

	Wrapper.prototype.send = function(target, message, type) {
		process.send(JSON.stringify({
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
		mainFunc = require(obj.path).bind(wrapper);
		mainFunc.apply(wrapper, [wrapper, wrapper.name, wrapper.path].concat(__args(arguments)));
	}
	catch (e) {
		console.error(e);
	}
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

