var Playlists = new Meteor.Collection("playlists"),
    PlaylistItems = new Meteor.Collection("playlist_items"),
    serverTime = new ServerTime(),
    player = new Player(serverTime),
    
    SCRUBBER_WIDTH = 500;

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
  Meteor.setTimeout(attachTypeAhead, 1); // FIXME: UGLY!
  return PlaylistItems.find({ playlist_id: currentPlaylist()._id}).fetch()
}


Template.playlistHeader.playlistName = function () {
  return !!currentPlaylist() ? currentPlaylist().name : '';
}

Template.playlistItems.playPauseIconClass = function() {
  return player.isPlaying(this) ? 'icon-pause' : 'icon-play';
}

Template.playlistItems.needlePosition = function() {

  var progress = player.getProgress(this);
  if (progress == 0) return 0;
  
  if (player.isPlaying(this)) { 
    var ctx = Meteor.deps.Context.current;
    Meteor.setTimeout(function() {
      ctx.invalidate();
    }, 250);
  }

  return Math.floor(SCRUBBER_WIDTH * progress);
}


Template.playlistItems.events = {
  'click .playlistItem .container .clickArea': function(e) {
  
    e.preventDefault();

    var $container = $(e.currentTarget);
    var offsetLeft = $container.offset().left;
    var id = $container.parents('.playlistItem').attr("id");
    var item = PlaylistItems.findOne(id);
    var relativeX = e.clientX - offsetLeft;
    var progress = relativeX / SCRUBBER_WIDTH;
    
    player.play(item, progress);

  },

  'click .playlistItem .playPauseIcon .clickArea': function(e) {
    e.preventDefault();

    var id = $(e.currentTarget).parents('.playlistItem').attr("id");
    var item = PlaylistItems.findOne(id);

    if (player.isPlaying(item))
      player.pause(item);
    else
      player.play(item);
  },

  'mousedown .playlistItem .moveIcon .clickArea': function(e) {
    e.preventDefault();

    
    var $pli = $(e.currentTarget).parents('.playlistItem');
    var startY = e.clientY,
        startX = e.clientX,
        originalX = $pli.offset().left,
        originalY = $pli.offset().top;

    $(document).mousemove(function(e) {
      var deltaY = e.clientY - startY;
      var deltaX = e.clientX - startX;
      $pli.offset({ top: originalY+deltaY, left: originalX+deltaX});
    });

    $(document).mouseup(function(e) {
      $(document).unbind('mousemove');
      $pli.offset({ top: originalY, left: originalX})
    })
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
  



function currentPlaylist() {
  return Playlists.findOne({ 
    name_simple: 
      Session.get('currentPlayListSimpleName')
  });
}


Meteor.startup(function() {
  serverTime.startSynchronizing()
  
});


