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
  var opts = { sort: { order: 1 }};
  return PlaylistItems.find({ playlist_id: currentPlaylist()._id }, opts).fetch()
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

    Session.set('dragOriginX', e.clientX);
    Session.set('dragOriginY', e.clientY);
    var id = $(e.target).parents('.playlistItem').attr('id');
    Session.set('draggedItemId', id);

  }
}

$(document).mouseup(function(e) {
  var afterId = hoveredItemId();
  if (afterId)
    insertAfter(Session.get('draggedItemId'), afterId);

  Session.set('dragOriginX', null);
  Session.set('dragOriginY', null);
  Session.set('draggedItemId', null);
})

$(document).mousemove(function(e) {
  Session.set('mouseX', e.clientX);
  Session.set('mouseY', e.clientY);
});


Template.playlistItems.placeHolderClassBelow = function() {
  return (this._id == hoveredItemId())  ? 'placeholder' : 'hidden';
}

Template.playlistItems.offsetX = function() {
  if (this._id != Session.get('draggedItemId')) return 0;
  return getDelta(Session.get('mouseX'), Session.get('dragOriginX'))
}

Template.playlistItems.offsetY = function() {
  if (this._id != Session.get('draggedItemId')) return 0;
  return getDelta(Session.get('mouseY'), Session.get('dragOriginY'))
}

function hoveredItemId() {
  if (!Session.get('dragOriginX')) return null;
  var mx = Session.get('mouseX'),
      my = Session.get('mouseY'),
      hoveredId = null;

  // TODO: Needs some kind of cache.
  $('.playlistItem').not('#'+Session.get('draggedItemId')).each(function() {
    var offset = $(this).offset(),
        x1 = offset.left,
        y1 = offset.top,
        x2 = offset.left + $(this).width(),
        y2 = offset.top  + $(this).height(),
        isInsideBox = !(mx < x1 || x2 < mx || my < y1 || y2 < my);
    if(isInsideBox) {
      hoveredId = this.id;
      return;
    }
  })
  if (hoveredId)
    console.log("Hovering", PlaylistItems.findOne(hoveredId).name)
  return hoveredId;
}

function getDelta(v1, v2) {
  if (v1 == null || v2 == null) return 0;
  return v1-v2;
}

function insertAfter(playlistItemId, afterPlaylistItemId) {
  

  // Make this into a server queue
  var pl = PlaylistItems.findOne(playlistItemId);
  console.log(pl)
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
      simpleTrack.order = getMaximumOrder(simpleTrack.playlist_id) + 1;
      PlaylistItems.insert(simpleTrack);
      $('#playlistView .new').val('').focus();
    }
  });

}
  

function getMaximumOrder(playlistId) {
  var pli = PlaylistItems.findOne({ playlist_id: playlistId}, { sort: {order: 1}} );
  if(!pli) return 0;
  return pli.order;
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


