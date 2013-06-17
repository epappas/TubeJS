module.exports = function (wractor, name, path) {
	console.log(name + ": " + process.pid);

	wractor.on("message", function (mId, sender, message, type) {
		var bucket = {};
		message.toLowerCase()
			.split(/\W+/g)
			.map(function (w) {
				if (w.match(/\b[a-z0-9]{2,}\b/gim)) {
					bucket[w] = (bucket[w] || 0) + 1;
					return bucket[w];
				}
				return 0;
			});
		wractor.send("reduce-actor", bucket);
	});
}