module.exports = function(wractor, name, path) {
	console.log(name + ": "+ process.pid);
	var served = 0;
	var bucket = {};
	wractor.on("message", function(sender, message, type) {

		for(var w in  message) {
			if(message.hasOwnProperty(w)) {
				bucket[w] = (bucket[w] || 0) + message[w];
			}
		}
		if(++served == 2) {
			wractor.send("master", bucket);
		}
	});
}