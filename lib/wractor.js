var wrapper = require("../lib/wrapper.js")(process);
var mainFunc = null;

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

process.on('exit', function () {
	wrapper.emit("die");
});

function __args(arg) {
	var arr = [];
	for (var i = 0; i < arg.length; ++i) {
		arr.push(arg[i]);
	}
	return arr;
}

