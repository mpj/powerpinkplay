Player = function(serverTime) {
	this._serverTime = serverTime;

};

var getPlaylistItem = function (itemOrId) {
  if (itemOrId._id)
  	return itemOrId;
  return PlaylistItems.findOne(itemOrId);
}

Player.prototype = {

	create: function(name) {
		if (name.length == 0 ) return;
	    var nameSimple = name.replace(" ", "").toLowerCase();
	    
	    var playlist = { 
	      name: name, 
	      name_simple: nameSimple 
	    }
	    return Playlists.findOne(Playlists.insert(playlist));
	},

	items: function(playlistOrId) {
		var id = playlistOrId._id || playlistOrId;
		var selector = { playlist_id: id },
			opts = { sort: { order: 1 } },
			cursor = PlaylistItems.find(selector, opts);
  		return cursor.fetch();
	},

	getProgress: function(itemOrId) {
	  var item = getPlaylistItem(itemOrId);

	  if (item.position == null) return 0;

	  var currentPosition;
	  if (item.playing_since)
	    currentPosition = this._serverTime.epoch() - item.playing_since + item.position;
	  else
	    currentPosition = item.position;

	  var progress = currentPosition / item.duration;
	  if (progress > 1) return 0;
	  return progress;
	},

	isPlaying: function(itemOrId) {
	  var item = getPlaylistItem(itemOrId);
	  return !!item.playing_since && 
	  	     !!this.getProgress(item);
	}, 

	pause: function(itemOrId) {
	  var pli = getPlaylistItem(itemOrId);
	  if (!this.isPlaying(pli)) return;

	  PlaylistItems.update(pli._id, { $set: {
	    position: this._serverTime.epoch() - pli.playing_since + pli.position, 
	    playing_since: null 
	  } });
	},

	play: function (itemOrId, progress) {
	  var pli = getPlaylistItem(itemOrId);
	  
	  if (!progress)
	  	if (pli.position)
	  		progress = pli.position / pli.duration;
	  	else
	  		progress = 0;
	    
	  PlaylistItems.update(pli._id, { $set: {
	    playing_since: this._serverTime.epoch(),
	    position: pli.duration * progress
	  } });

	  // Stop and clear all other playlistItems on this playlist.
	  PlaylistItems.update(
	    { playlist_id: pli.playlist_id, _id: { $ne: pli._id } }, 
	    { $set: { playing_since: null, position: null } }, 
	    { multi: true }
	  )
	},

	getMaximumOrder: function(playlistId) {
	  var pli = PlaylistItems.findOne({ playlist_id: playlistId}, { sort: {order: -1}} );
	  if(!pli) return 0;
	  return pli.order;
	},

	move: function(playlistItemId, afterPlaylistItemId) {
  
	  // Make this into a server queue
	  var pl = PlaylistItems.findOne(playlistItemId);
	  var others = PlaylistItems.find(
	      { playlist_id: pl.playlist_id, _id: { $ne: playlistItemId } },
	      { sort: {order: 1}}
	    ).fetch();

	  var setOrder = function(id, order) {
	    PlaylistItems.update(id, { $set: { order: order } });
	  }
	  
	  var i = 0;
	  _.each(others, function(o) {
	    setOrder(o._id, ++i)
	    if (o._id == afterPlaylistItemId) {
	      setOrder(playlistItemId, ++i)
	    }
	  })
	},

	remove: function(playlistItemId) {
		PlaylistItems.remove(playlistItemId);
	},

	add: function(name, href, duration, playlistId) {
	  var playlistItem = {}
      PlaylistItems.insert({
      	name: name,
      	href: href,
      	duration: duration,
      	playlist_id: playlistId,
      	order: this.getMaximumOrder(playlistId) + 1
      });
	}
}
