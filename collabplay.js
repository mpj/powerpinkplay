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

  
  Template.playlistItems.items = function () {

    if (!currentPlaylist()) return [];
    
    setTimeout(attachTypeAhead, 1);
    return PlaylistItems.find({ playlist_id: currentPlaylist()._id}).fetch()
  }

  Template.playerControls.playPauseButtonLabel = function() {
    var simpleName = Session.get('currentPlayListSimpleName');
    if(!simpleName) return
    var playlist = Playlists.findOne({ name_simple: simpleName});
    if (!playlist)
      return;
    if (playlist.playing_at)
      return "Pause";
    return "Play"
  }

  Template.playlistHeader.playlistName = function () {
    return !!currentPlaylist() ? currentPlaylist().name : '';
  }


  Template.playlistHeader.needlePosition = function() {

    var playPos = getPlaypos();
    console.log("plauPos", playPos)
    if (playPos == 0) return 0;
    var ctx = Meteor.deps.Context.current;
    setTimeout(function() {
      ctx.invalidate();
    },250);

    return playPos;
  }

  Template.playlist.events = {
    'click .playlistItem': function(e) {
      
      e.preventDefault();
      play($(e.target).attr('data-href'), 0);
    }
  }



  Template.playerControls.events = {
    'click .playPause': function(e) {
      e.preventDefault();
      
      if (isPlaying())
        pause();
      else {
        play($(e.target).attr('data-href'));
      }
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
        PlaylistItems.insert(simpleTrack);
        $('#playlistView .new').val('').focus();

      }
    });

  }
    

}

function getPlaypos() {
  var playlist = currentPlaylist();
  if(!playlist || playlist.playing_from == null) return 0; 
  if(!playlist.playing_at) return playlist.playing_from;

  var now = Number(new Date());
  var playingFor = now - playlist.playing_at;
  var position = playlist.playing_from + playingFor;
  
  var duration = getDurationByHref(playlist.playing_track);
  if (position > duration)
    return 0;

  return position;
}

function play(href, fromPos) {
  if (!fromPos == null) fromPos = getPlaypos();
  changeCurrentPlayList({
    playing_at:     Number(new Date()),
    playing_from:   fromPos,
    playing_track:  href,
  })
}

function pause() {
  changeCurrentPlayList({
    playing_from: getPlaypos(),
    playing_at:   null
  })
}

function isPlaying() {
  var playlist = currentPlaylist();
  return playlist && playlist.playing_at;
}

function currentPlaylist() {
  return Playlists.findOne({ 
    name_simple: 
      Session.get('currentPlayListSimpleName')
  });
}

function changeCurrentPlayList(properties) {
     console.log("play", properties)
  Playlists.update(
    { name_simple: Session.get('currentPlayListSimpleName') },
    { $set: properties }
  )
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