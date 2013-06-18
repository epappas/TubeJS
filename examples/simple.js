var tubeJs = require('../index.js');
var readline = require('readline');
var channel = new tubeJs();
var rl = readline.createInterface({
	input : process.stdin,
	output: process.stdout
});

console.log("PPID: " + process.pid);

channel.spawn("cliactor1", require.resolve("./simpleactor.js"));
channel.spawn("cliactor2", require.resolve("./simpleactor.js"));

setTimeout(function () {
	rl.question("Send to wractor: ", function (answer) {
		var ansplit = answer.split(/\W+/g);
		console.log("About to send to " + ansplit[0] + " by " + ansplit[1] + " -> " + ansplit[2]);
		channel.of(ansplit[1]).send(ansplit[0], ansplit[2], function () {
			console.log("Sent!");
		});
		rl.close();
	});
}, 1000);
