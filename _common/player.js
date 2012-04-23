Player = function() { };

Player.prototype = {

	getProgress: function(playlistItem) {
	  var item = playlistItem;

	  if (item.position == null) return 0;

	  var currentPosition;
	  if (item.playing_since)
	    currentPosition = Number(new Date()) - item.playing_since + item.position;
	  else
	    currentPosition = item.position;

	  var progress = currentPosition / item.duration;
	  if (progress > 1) return 0;
	  return progress;
	},

	isPlaying: function(playlistItem) {
	  return !!playlistItem.playing_since && 
	  	     !!this.getProgress(playlistItem);
	}, 

	pause: function(playlistItem) {
	  var pli = playlistItem;
	  if (!this.isPlaying(pli)) return;

	  PlaylistItems.update(pli._id, { $set: {
	    position: Number(new Date()) - pli.playing_since + pli.position, 
	    playing_since: null 
	  } });
	},

	play: function (playlistItem, progress) {
	  var pli = playlistItem;
	  
	  if (!progress)
	  	if (pli.position)
	  		progress = pli.position / pli.duration;
	  	else
	  		progress = 0;
	    
	  PlaylistItems.update(pli._id, { $set: {
	    playing_since: Number(new Date()),
	    position: pli.duration * progress
	  } });

	  // Stop and clear all other playlistItems on this playlist.
	  PlaylistItems.update(
	    { playlist_id: pli.playlist_id, _id: { $ne: pli._id } }, 
	    { $set: { playing_since: null, position: null } }, 
	    { multi: true }
	  )
	}

}
