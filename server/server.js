var serverTime = new ServerTime,
    player = new Player(serverTime);

Meteor.methods({

  /*
   * Server method that simply returns the time on the server
   * as a unix timestamp. This is used by clients to keep playing
   * in sync even if someones clock is a little off.
   */
  serverTime: function () {
    return Number(new Date());
  }

});

var query = PlaylistItems.find({});

// Since none of the connected clients really "own" the playlist,
// skipping to the next track when the needle reaches the end of a track
// is performed by the server, which continually observes the PlaylistItems 
// collection for changes. 

var handle = query.observe({
  
  changed: function (playlistItem) {

    var pli = playlistItem;
    if (!pli.playing_since) {
      // Not playing.
      return; 
    }

    // Okay, we somebody is playing this playlistitem from a new position.
    // Calculate when this track ends playing, and we'll check for skipping
    // then.
    var timeleft = pli.duration - pli.position,
        timePassedSinceStart = Number(new Date()) - pli.playing_since,
        checkForSkippingAt = timeleft - timePassedSinceStart + 1;

    // Code in Meteor needs to run in a Fiber (https://github.com/laverdet/node-fibers)
    // so wrap the call to checkForSkipping in one.
    var fiber = Fiber(function() { checkForSkipping(pli._id) });
    Meteor.setTimeout(function() { fiber.run() }, checkForSkippingAt);

  }

});

/*
 *  Check if a playlistItem is done playing - if so,
 *  jump to the next track in the playlist.
 */
function checkForSkipping(playlistItemId) {
    var pli = PlaylistItems.findOne(playlistItemId),
        isStillPlaying = !!pli.playing_since,
        isPastEnd = ((Number(new Date()) - pli.playing_since + pli.position)) > pli.duration;

    if (!isStillPlaying) {
      // Not playing anymore (somebody probably changed tracks, or scrubbed)
      return;
    }
    
    if(isPastEnd) {
        // Is playing, and has went past the end of the track. 
        // This means that we should skip to the next track.
        var nextSibling = findNextSibling(pli);
        if (nextSibling) player.play(nextSibling);
    }
}

/*
 *  Finds the next playlistItem in the playlist.
 */ 
function findNextSibling(playlistItem) {
    var selector = { 
        playlist_id: playlistItem.playlist_id, 
        order: { $gt: playlistItem.order } 
    }
    var options = { sort: { order: 1 } }    
    return PlaylistItems.findOne(selector, options);
}



