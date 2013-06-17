var tubeJs = require('../index.js');
var channel = new tubeJs(function (tube) {
	tube.on("message",function (message) {
		console.log(message);
	}).on("request",function (message) {
			console.log(message);
		}).on("die",function (message) {
			// DIE a die notification
			console.log(message);
		}).on("command",function (message) {
			// CMD Actor's Command to master
			console.log(message);
		}).on("reply",function (message) {
			console.log(message);
		}).on("unknown", function (message) {
			console.log(message);
		});
});

channel.spawn("map-actor1", require.resolve("./mapactor.js"));
channel.spawn("map-actor2", require.resolve("./mapactor.js"));
channel.spawn("reduce-actor", require.resolve("./reduceactor.js"));


setTimeout(function () {
	channel.of("map-actor1").send("master", TEXT1, function () {
		console.log("Sent to map-actor1!");
	});
	channel.of("map-actor2").send("master", TEXT2, function () {
		console.log("Sent to map-actor2!");
	});
}, 1000);

var TEXT1 = "Lorem ipsum dolor sit amet, " +
	"consectetur adipiscing elit. Suspendisse " +
	"id dolor sem, quis scelerisque nisl. Fusce " +
	"at lacus ante, nec gravida augue. Suspendisse " +
	"non lacus tortor, eu porta nisl. Sed quis rhoncus " +
	"urna. Nullam sit amet nulla nunc, quis faucibus orci. " +
	"In sagittis varius sapien quis blandit. Nulla mattis " +
	"augue ut dolor fringilla a rhoncus justo faucibus. Etiam " +
	"gravida posuere dui, sed interdum tortor congue sit amet. " +
	"Lorem ipsum dolor sit amet, consectetur adipiscing elit. " +
	"Fusce nec purus id nisi pellentesque lobortis.\n" +
	"Nulla facilisi. Maecenas venenatis blandit aliquam. Etiam " +
	"vel est vel sapien sagittis faucibus. In hac habitasse platea " +
	"dictumst. Donec malesuada congue neque, vitae ornare lectus hendrerit " +
	"in. Nullam semper hendrerit justo nec porttitor. Donec sit amet velit " +
	"leo. Donec sit amet odio tellus, feugiat fermentum dolor. Integer " +
	"nec arcu in est vulputate dictum.";
var TEXT2 = "Etiam sed elit eget velit interdum dapibus in eget urna. " +
	"Suspendisse potenti. Vivamus arcu urna, adipiscing non laoreet a, " +
	"congue sit amet quam. Morbi sagittis, mauris in vehicula ultricies, " +
	"neque massa lacinia risus, eget condimentum magna lectus vel nibh. " +
	"Suspendisse molestie nisi ut arcu vehicula porta. Quisque nec tellus elit. " +
	"Nulla ultrices laoreet scelerisque. Quisque vel est elit. Quisque nec sem " +
	"feugiat ipsum fringilla posuere at non lacus. Sed et sapien sit amet " +
	"odio molestie volutpat eget ac sem. Donec a urna felis. Cum sociis " +
	"natoque penatibus et magnis dis parturient montes, nascetur ridiculus " +
	"mus. Suspendisse at turpis a metus commodo elementum. Donec tellus ipsum, " +
	"vestibulum a imperdiet at, porta ut massa. Donec quis quam leo.\n" +
	"Nunc pharetra molestie tellus, ut aliquet nulla elementum vitae. " +
	"Phasellus dictum magna a eros dignissim id feugiat neque viverra. " +
	"Aliquam viverra molestie pulvinar. Donec nunc ipsum, posuere non " +
	"rutrum et, hendrerit sit amet est. Ut cursus egestas dolor, varius " +
	"ornare lorem tincidunt interdum. Nam ut augue sed sem porta facilisis " +
	"quis non lorem. Quisque sit amet dolor id quam condimentum cursus. " +
	"Fusce accumsan posuere eleifend. Vestibulum ornare feugiat imperdiet. " +
	"Class aptent taciti sociosqu ad litora torquent per conubia nostra, " +
	"per inceptos himenaeos. In hac habitasse platea dictumst. Praesent " +
	"congue vehicula dapibus. Quisque non eros sed enim porta egestas.";