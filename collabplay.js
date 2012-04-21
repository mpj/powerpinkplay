var Playlists = new Meteor.Collection("playlists"),
    PlaylistItems = new Meteor.Collection("playlist_items");

if (Meteor.is_client) {

  var ClientRouter = Backbone.Router.extend({
      routes: {
          "p/:simple_name/" :       "getPlayListBySimpleName"
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

  Template.playlist.playListName = function () {
    return !!currentPlaylist() ? currentPlaylist().name : '';
  }

  Template.playlist.playlistItems = function () {

    if (!currentPlaylist()) return [];
    // FIXME: It's REALLY ugly to have this call here,
    // can we do it nicer?
    setTimeout(attachTypeAhead, 1);
    return PlaylistItems.find({ playlist_id: currentPlaylist()._id}).fetch()
  }

  Template.playlist.playPauseButtonLabel = function() {
    var simpleName = Session.get('currentPlayListSimpleName');
    if(!simpleName) return
    var playlist = Playlists.findOne({ name_simple: simpleName});
    if (!playlist)
      return;
    if (playlist.playing_at)
      return "Pause";
    return "Play"
  }

  Template.playlist.needlePosition = function() {

    var now = Number(new Date());
    var playlist = currentPlaylist();
    if(!playlist || !playlist.playing_at) return;
    var playingFor = now - playlist.playing_at;
    var position = playlist.playing_from + playingFor;
    
    // TODO: check for overflow
    var duration = getDurationByHref(playlist.playing_track);
    if (position > duration )
      return 0;

    var ctx = Meteor.deps.Context.current;
    setTimeout(function() {
      ctx.invalidate();
    },250);

    return position;
  }

  Template.playlist.events = {
    'click .playlistItem': function(e) {
      
      e.preventDefault();
      Playlists.update(
        currentPlaylist()._id,
        { 
          $set: {
            playing_at:     Number(new Date()),
            playing_from:   0,
            playing_track:  $(e.target).attr('data-href')
          }
        }
      )
    }
  }

  Template.createPlayList.events = {
    'click .do' : function (e) {
      var playListName = $('#createPlayListView .name').val();
      if (playListName.length == 0 ) return;
      var playListNameSimple = playListName.replace(" ", "").toLowerCase();
      Meteor.router.navigate("p/" + playListNameSimple + "/", {trigger: true});
      var id = Playlists.insert({ 
        name: playListName, 
        name_simple: playListNameSimple 
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
            console.log(track)
            simpleTracks.push({
              name:   track.name,
              href:   track.href,
              duration: track.length
            });
          }
          return typeahead.process(simpleTracks);
        });
      },

      onselect: function(simpleTrack) {
        simpleTrack.playlist_id = currentPlaylist()._id;
        console.log("adding", simpleTrack)
        PlaylistItems.insert(simpleTrack)
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