var uuid = require("../lib/modUUID.js");
var events = require('events');
var hex = uuid(16);
var hexUuid = new hex('xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');

module.exports = (function (enviroment) {

	/**
	 *
	 * @returns {*}
	 * @constructor
	 */
	function Wractor() {

		this.enviroment = enviroment;
		this.name = "";
		this.path = "";
		this.afterMe = [];
		this.children = [];
		this.mailBox = {};
		this.pingMailBox = [];
		//this.mailBoxQ = [];
		this.lastMID = "";
		return this;
	}

	// inherit
	(function (father) {
		// I am your Father!
		this.prototype = father;
		return this;
	}).call(Wractor, new events.EventEmitter());

	/**
	 * Handle message logic
	 * @param message
	 * @returns {*}
	 */
	Wractor.prototype.handle = function (message, servable) {
		var obj = (typeof message === "string" ? JSON.parse(message) : message);
		//console.log(message);
		if (this.mailBox[obj.messageId]) {
			var cb = this.mailBox[obj.messageId].callback;
			cb(null, {
				messageId: obj.messageId,
				source   : this.mailBox[obj.messageId].sendee,
				requester: obj.sendee,
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
				this.pingMailBox.push(obj);
				this.emit.apply(this, ["ping", obj.messageId, obj.sender, obj.value, obj.type]);
				break;
			case 5: // CMD
				this.emit.apply(this, ["command", obj.messageId, obj.sender, obj.value, obj.type]);
				break;
			case 6: // SPN
				this.children.push(obj.value.wractor);
				this.afterMe.push(obj.value.wractor);
				this.emit.apply(this, ["spawn", obj.messageId, obj.sender, obj.value, obj.type]);
				break;
			case 7: // TUB
				this.tube(obj.value.wractor);
				this.emit.apply(this, ["tube", obj.messageId, obj.sender, obj.value, obj.type]);
				break;
			case 8: // REP
				this.emit.apply(this, ["reply", obj.messageId, obj.sender, obj.value, obj.type]);
				break;
			case 9: // SRV
				this.emit.apply(this, ["serve", obj, servable]);
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
	Wractor.prototype.ahead = function (message, type) {
		for (var i = this.afterMe.length; i--;) {
			if (this.afterMe[i]) {
				this.send(this.afterMe[i], message, type);
			}
		}
		return this;
	};

	/**
	 *
	 * @param wractor
	 * @param path
	 * @param callback
	 * @returns {*}
	 */
	Wractor.prototype.spawn = function (wractor, path, callback) {
		var mId = hexUuid.get();
		this.enviroment.send(JSON.stringify({
			messageId: mId,
			sender   : this.name,
			sendee   : "master",
			value    : {
				wractor: wractor,
				path   : path
			},
			type     : 6
		}));
		this.lastMID = mId;
		this.mailBox[mId] = {
			messageId: mId,
			message  : wractor,
			target   : "master",
			callback : (callback || function () {} )
		};
		this.children.push(wractor);
		this.afterMe.push(wractor);
		return this;
	};

	/**
	 *
	 * @param wractor
	 * @param callback
	 * @returns {*}
	 */
	Wractor.prototype.tube = function (wractor, callback) {
		this.afterMe.push(wractor);
		return this;
	};

	/**
	 *
	 * @returns {*}
	 */
	Wractor.prototype.lastMessageId = function () {
		return this.lastMID;
	};

	/**
	 * Tells master to pass this message to the target
	 * @param target
	 * @param message
	 * @param type
	 * @returns {*}
	 */
	Wractor.prototype.send = function (target, message, type) {
		if(typeof target === "string" && message === null) {
			// the message is assigned on the target
			this.enviroment.send(target);
			return this;
		}
		var mId = hexUuid.get();
		this.enviroment.send(JSON.stringify({
			messageId: mId,
			sender   : this.name,
			sendee   : target,
			value    : message,
			type     : type || 0
		}));
		this.lastMID = mId;
		return this;
	};

	/**
	 *
	 * @param mId
	 * @param target
	 * @param message
	 * @param type
	 * @returns {*}
	 */
	Wractor.prototype.reply = function (mId, target, message, type) {
		this.enviroment.send(JSON.stringify({
			messageId: mId,
			sender   : this.name,
			sendee   : target,
			value    : message,
			type     : type || 0
		}));
		return this;
	};

	/**
	 *
	 * @returns {*}
	 */
	Wractor.prototype.pong = function () {
		var __this = this;
		for (var i = this.pingMailBox.length; i--;) {
			(function () {
				__this.enviroment.send(JSON.stringify({
					messageId: this.messageId,
					sender   : __this.name,
					sendee   : this.sender,
					value    : "PONG " + Date.now(),
					type     : 0
				}));
			}).call(this.pingMailBox[i]);
		}
		return this;
	};

	/**
	 *
	 * @param target
	 * @param callback
	 * @returns {*}
	 */
	Wractor.prototype.ping = function (target, callback) {
		var mId = hexUuid.get();
		var str = "PING " + Date.now();
		this.enviroment.send(JSON.stringify({
			messageId: mId,
			sender   : this.name,
			sendee   : target,
			value    : str,
			type     : 4
		}));
		this.lastMID = mId;

		this.mailBox[mId] = {
			messageId: mId,
			message  : str,
			target   : target,
			callback : (callback || function () {} )
		};
		//this.mailBoxQ.push(mId);
		return this;
	};

	/**
	 *
	 * @param target
	 * @param message
	 * @param callback
	 * @returns {*}
	 */
	Wractor.prototype.request = function (target, message, callback) {
		var mId = hexUuid.get();
		this.enviroment.send(JSON.stringify({
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

	return new Wractor(); // Thread local singleton
});