ServerTime = function() {
	this._offSet = 0;
}

ServerTime.prototype = {
	
	updateTime: function(serverEpochNow, requestTime) {
		this._offSet = Number(new Date()) - serverEpochNow;
		if (requestTime) {
			// Compensate for latency. We're 
			// guessing that the trip to server is
			// half of the request time.
			this._offSet -= requestTime/2;
		}
	},

	epoch: function() { 	
		return Number(new Date()) - this._offSet;
	}
}

