var Playlists = new Meteor.Collection("playlists"),
    PlaylistItems = new Meteor.Collection("playlist_items");


var SCRUBBER_WIDTH = 500;
if (Meteor.is_client) {

  var ClientRouter = Backbone.Router.extend({
      routes: {
          "p/:simple_name/": "getPlayListBySimpleName"
      },

      getPlayListBySimpleName: function( simpleName ) {
        Session.set("currentPlayListSimpleName", simpleName); 
      }
  });
 

  Meteor.router = new ClientRouter;
  Backbone.history.start({pushState: true});


  Template.createPlayList.viewClass = function () {
    return currentPlaylist() ? 'hidden' : '';
  }

  Template.playlist.viewClass = function () {
    return currentPlaylist() ? '' : 'hidden';
  }

  
  Template.playlistItems.items = function () {

    if (!currentPlaylist()) return [];
    
    setTimeout(attachTypeAhead, 1); // FIXME: UGLY!
    return PlaylistItems.find({ playlist_id: currentPlaylist()._id}).fetch()
  }


  Template.playlistHeader.playlistName = function () {
    return !!currentPlaylist() ? currentPlaylist().name : '';
  }

  Template.playlistItems.playPauseIconClass = function() {

    var now = Number(new Date());

    var isPlaying = !!this.playing_since && 
                    this.position + now - this.playing_since < this.duration

    return isPlaying ? 'icon-pause' : 'icon-play';
  }

  Template.playlistItems.needlePosition = function() {

    var item = this,
        now = Number(new Date());

    if (!item || item.position == null) return 0;

    var currentPosition;
    if (item.playing_since)
      currentPosition = now - item.playing_since + item.position;
    else
      currentPosition = item.position;

    var progress = currentPosition / item.duration;
    if (progress > 1)
      return 0;

    if (!!item.playing_since) { 
      var ctx = Meteor.deps.Context.current;
      setTimeout(function() {
        ctx.invalidate();
      },250);
    }

    return Math.floor(SCRUBBER_WIDTH * progress);
  }

  Template.playlistItems.events = {
    'click .playlistItem .container': function(e) {
      
      e.preventDefault();
      var $container = $(e.currentTarget);
      var offsetLeft = $container.offset().left;
      var id = $container.parent().attr("id");
      var now = Number(new Date());
      var item = PlaylistItems.findOne(id);
      var relativeX = e.clientX - offsetLeft;
      var progress = relativeX / SCRUBBER_WIDTH;
      
      // If this item is not active, and another is, clear it.
      if (activeItem())
          PlaylistItems.update(activeItem()._id, 
            { $set: { position: null, playing_since: null } })

      PlaylistItems.update(item._id, { $set: {
        playing_since: now,
        position: item.duration * progress
      } });

    },

    'click .playlistItem .playPauseIcon': function(e) {
      e.preventDefault();
      Meteor.flush()

      var id = $(e.currentTarget).parent().attr("id");
      var item = PlaylistItems.findOne(id);

      var now = Number(new Date());

      if (item.position == null) {
        // New item, remove the active status of any old item.
        if(activeItem())
          PlaylistItems.update(activeItem()._id, { $set: { position: null, playing_since: null } })

        PlaylistItems.update(item._id, { $set: { 
          position: 0, playing_since: now 
        } });
      } else if (item.playing_since) {
        // Is playing, pause it at current position.
        PlaylistItems.update(item._id, { $set: {
          position: now - item.playing_since + item.position, 
          playing_since: null 
        } });
      } else {
        // Has a .position, but not .playing_since, that 
        // means it's paused. Start playing it again.
        PlaylistItems.update(item._id, { $set: {
          playing_since: now
        } });

      }

    }
  }


  Template.createPlayList.events = {
    'click .do' : function (e) {
      var playlistName = $('#createPlayListView .name').val();
      if (playlistName.length == 0 ) return;
      var playlistNameSimple = playlistName.replace(" ", "").toLowerCase();
      Meteor.router.navigate("p/" + playlistNameSimple + "/", {trigger: true});
      var id = Playlists.insert({ 
        name: playlistName, 
        name_simple: playlistNameSimple 
      });
    }
  };


  function attachTypeAhead() {
    Meteor.flush();
    $('#playlistView .new').typeahead({

      property: 'name',
      
      source: function (typeahead, query) {
        var uri = "http://ws.spotify.com/search/1/track.json?q=" + query;
        Meteor.http.call("GET", uri, {}, function (error, result) {
          var data = JSON.parse(result.content);
          var simpleTracks = [];
          for (var i=0;i<data.tracks.length;i++) {
            var track = data.tracks[i];
            simpleTracks.push({
              name:   track.name + " (" + track.artists[0].name + ")",
              href:   track.href,
              duration: track.length*1000
            });
          }
          return typeahead.process(simpleTracks);
        });
      },

      onselect: function(simpleTrack) {
        simpleTrack.playlist_id = currentPlaylist()._id;
        PlaylistItems.insert(simpleTrack);
        $('#playlistView .new').val('').focus();

      }
    });

  }
    
}

function playPauseItem(id, relativeXClicked) {
  var item = PlaylistItems.findOne(id);
  var now = Number(new Date());

  if (item.position == null) {
    // New item, remove the active status of the old item.
    if(activeItem())
      PlaylistItems.update(activeItem()._id, { $set: { position: null, playing_since: null } })
    PlaylistItems.update(item._id, { $set: { 
      position: 0, playing_since: now 
    } });
  } else if (item.playing_since) {
    // Is playing, pause it at current position.
    PlaylistItems.update(item._id, { $set: {
      position: now - item.playing_since + item.position, 
      playing_since: null 
    } });
  } else {
    // Has a .position, but not .playing_since, that 
    // means it's paused. Start playing it again.
    var progress = relativeXClicked /  SCRUBBER_WIDTH;
    PlaylistItems.update(item._id, { $set: {
      playing_since: now,
      position: item.duration * progress,
    } });

  }

}

function activeItem() {
  return PlaylistItems.findOne({ 
    playlist_id: currentPlaylist()._id,
    position: { $gte: 0 }
  });
}

function currentPlaylist() {
  return Playlists.findOne({ 
    name_simple: 
      Session.get('currentPlayListSimpleName')
  });
}


function getDurationByHref(href) {
  var playlistItem = PlaylistItems.findOne({ href: href});
  if (!playlistItem) return 0;
  return playlistItem.duration * 1000;
}


if (Meteor.is_server) {

  Meteor.startup(function () {
    // code to run on server at startup
  });
} 