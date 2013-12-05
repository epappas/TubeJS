var wractor = require("../lib/wractor.js")(process);
var mainFunc = null;

// a cool hack :)
var func = init;
function init(message) {
	try {
		var obj = JSON.parse(message);
		wractor.name = obj.name;
		wractor.path = obj.path;
		mainFunc = require(obj.path).bind(wractor); // actor is fetched
		mainFunc.apply(wractor, [wractor, wractor.name, wractor.path].concat(__args(arguments)));
		process.send(JSON.stringify({
			messageId: obj.messageId,
			sender   : obj.name,
			sendee   : "master",
			value    : obj.name,
			type     : 0
		}));
	}
	catch (e) {
		console.error(e);
	}
	// a cool hack; handler will be the function that will process
	// each incoming message after this initiation
	func = handler;
}

/**
 *
 * @returns {*|Function|s.handle|socket.handle|handle|socket.handle|Function|Function|*|*|Function|Function}
 */
function handler() {
	return wractor.handle.apply(wractor, [].concat(__args(arguments)));
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
	wractor.emit("die");
});

function __args(arg) {
	var arr = [];
	for (var i = 0; i < arg.length; ++i) {
		arr.push(arg[i]);
	}
	return arr;
}

