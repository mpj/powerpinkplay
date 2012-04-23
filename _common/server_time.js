ServerTime = function() {
	this._offSet = 0;
}

ServerTime.prototype = {
	
	updateTime: function(serverEpochNow) {
		this._offSet = Number(new Date()) - serverEpochNow;
	},

	epoch: function() {
		return Number(new Date()) - this._offSet;
	}
}

