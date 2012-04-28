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
  return player.currentPlaylist() ? 'hidden' : '';
}

Template.playlist.viewClass = function () {
  return player.currentPlaylist() ? '' : 'hidden';
}


Template.playlistItems.items = function () {

  if (!player.currentPlaylist()) return [];
  Meteor.setTimeout(attachTypeAhead, 1); // FIXME: UGLY!
  var opts = { sort: { order: 1 }};
  return PlaylistItems.find({ playlist_id: player.currentPlaylist()._id }, opts).fetch()
}


Template.playlistHeader.playlistName = function () {
  return !!player.currentPlaylist() ? player.currentPlaylist().name : '';
}

Template.playlistItem.playPauseIconClass = function() {
  return player.isPlaying(this) ? 'icon-pause' : 'icon-play';
}

Template.playlistItem.needlePosition = function() {

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


Template.playlistItem.events = {
  'click .playlistItem .container .clickArea': function(e) {
  
    e.preventDefault();

    var $container = $(e.target).parents('.container'),
        offsetLeft = $container.offset().left,
        relativeX = e.clientX - offsetLeft,
        progress = relativeX / SCRUBBER_WIDTH,
        id = $container.parents('.playlistItem').attr("id");
    
    player.play(id, progress);
  },

  'click .playlistItem .playPauseIcon .clickArea': function(e) {
    e.preventDefault();
    var id = $(e.target).parents('.playlistItem').attr("id");
    if (player.isPlaying(id))
      player.pause(id);
    else
      player.play(id);
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
    player.move(Session.get('draggedItemId'), afterId);

  Session.set('dragOriginX', null);
  Session.set('dragOriginY', null);
  Session.set('draggedItemId', null);
})

$(document).mousemove(function(e) {
  Session.set('mouseX', e.clientX);
  Session.set('mouseY', e.clientY);
});


Template.playlistItem.placeHolderClassBelow = function() {
  return (this._id == hoveredItemId())  ? 'placeholder' : 'hidden';
}

Template.playlistItem.offsetX = function() {
  if (this._id != Session.get('draggedItemId')) return 0;
  return getDelta(Session.get('mouseX'), Session.get('dragOriginX'))
}

Template.playlistItem.offsetY = function() {
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
  return hoveredId;
}

function getDelta(v1, v2) {
  if (v1 == null || v2 == null) return 0;
  return v1-v2;
}

Template.createPlayList.events = {
  'click .do' : function (e) {
    var playlist = player.create($('#createPlayListView .name').val());
    Meteor.router.navigate("p/" + playlist.name_simple + "/", {trigger: true});
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

    onselect: function(track) {
      player.add(track.name, track.href, track.duration, player.currentPlaylist()._id);
      $('#playlistView .new').val('').focus();
    }
  });

}


Meteor.startup(function() {
  serverTime.startSynchronizing()
});


