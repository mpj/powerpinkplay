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
    return isPlaying(this) ? 'icon-pause' : 'icon-play';
  }

  Template.playlistItems.needlePosition = function() {

    var progress = getProgress(this);
    if (progress == 0) return 0;
    
    if (isPlaying(this)) { 
      var ctx = Meteor.deps.Context.current;
      setTimeout(function() {
        ctx.invalidate();
      },250);
    }

    return Math.floor(SCRUBBER_WIDTH * progress);
  }

  function getProgress(playlistItem) {
    var item = playlistItem,
        now = Number(new Date());

    if (item.position == null) return 0;

    var currentPosition;
    if (item.playing_since)
      currentPosition = now - item.playing_since + item.position;
    else
      currentPosition = item.position;

    var progress = currentPosition / item.duration;
    if (progress > 1) return 0;
    return progress;
  }

  function isPlaying(playlistItem) {
    if (!playlistItem.playing_since) return false;
    return getProgress(playlistItem) < 1;
  }

  Template.playlistItems.events = {
    'click .playlistItem .container': function(e) {
      
      e.preventDefault();

      var $container = $(e.currentTarget);
      var offsetLeft = $container.offset().left;
      var id = $container.parent().attr("id");
      var item = PlaylistItems.findOne(id);
      var relativeX = e.clientX - offsetLeft;
      var progress = relativeX / SCRUBBER_WIDTH;
      
      play(item, progress)

    },

    'click .playlistItem .playPauseIcon': function(e) {
      e.preventDefault();

      var id = $(e.currentTarget).parent().attr("id");
      var item = PlaylistItems.findOne(id);

      if (isPlaying(item))
        pause(item);
      else
        play(item);
    }
  }

  function pause(playlistItem) {
    var pli = playlistItem;
    if (!isPlaying(pli)) return;

    var now = Number(new Date());
    PlaylistItems.update(pli._id, { $set: {
      position: now - pli.playing_since + pli.position, 
      playing_since: null 
    } });
  }

  function play(playlistItem, progress) {
    var pli = playlistItem;

    progress = progress || pli.position / pli.duration;
    clearPlayState(currentPlaylist());

    var now = Number(new Date());
    PlaylistItems.update(pli._id, { $set: {
      playing_since: now,
      position: pli.duration * progress
    } });
  }

  function clearPlayState(playlist) {
    PlaylistItems.update(
      { playlist_id: playlist._id }, 
      { $set: { playing_since: null, position: null } }, 
      { multi: true }
    )
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


function currentPlaylist() {
  return Playlists.findOne({ 
    name_simple: 
      Session.get('currentPlayListSimpleName')
  });
}


if (Meteor.is_server) {

  Meteor.startup(function () {
    // code to run on server at startup
  });
} 