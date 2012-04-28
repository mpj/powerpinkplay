ServerTime = function() {
	this._offSet = 0;
}

ServerTime.prototype = {
	
	startSynchronizing: function() {
		
		this._synchronize();
	    
	    // Re-sync time every 2 minutes, in case the user
	    // keeps the window open a long time.
	    var that = this;
	    Meteor.setInterval(function() {
	    	that._synchronize.call(that);
	    }, 2*60*100); 
	},

	_synchronize: function() {
		var callBegin = Number(new Date());
		var that = this;
	    Meteor.call('serverTime', function(error, result) {
	      var callEnd = Number(new Date());
	      var requestTime = callEnd - callBegin;
	      that._updateTime(result, requestTime);
	    });
	},

	_updateTime: function(serverEpochNow, requestTime) {
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

