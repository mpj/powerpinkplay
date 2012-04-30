// TODO: Sorry, this is not very clean at the moment. If it grows, find a better structure!

var serverTime = new ServerTime,
    player = new Player(serverTime);

Meteor.methods({
  serverTime: function () {
    return Number(new Date());
  }
});

var query = PlaylistItems.find({});

var handle = query.observe({
  changed: function (playlistItem) {

  	var pli = playlistItem;
  	if (!pli.playing_since) return;

	var timeleft = pli.duration - pli.position;
	var timePassedSinceStart = Number(new Date()) - pli.playing_since;

	var fiber = Fiber(function() {
		checkForSkipping(pli._id);
	});

	Meteor.setTimeout(function() { fiber.run() },
		timeleft - timePassedSinceStart + 1);

  }
});

function checkForSkipping(playlistItemId) {
	var pli = PlaylistItems.findOne(playlistItemId);
 
  	var isPastEnd = !!pli.playing_since &&
  					((Number(new Date()) - pli.playing_since + pli.position)) > pli.duration;
    if(isPastEnd) {
		var nextSibling = findNextSibling(pli);
		if (nextSibling) player.play(nextSibling);
    }
}

function findNextSibling(playlistItem) {
	var selector = { 
		playlist_id: playlistItem.playlist_id, 
		order: { $gt: playlistItem.order } 
	}
	var options = { sort: { order: 1 } }	
	return PlaylistItems.findOne(selector, options);
}



