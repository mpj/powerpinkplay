var dragManager = new DragManager;

// This view should only be visible if we have navigated to a playlist.
Template.playlist.viewClass = function () {
  return currentPlaylist() ? '' : 'hidden';
}

Template.playlistHeader.playlistName = function () {
  return !!currentPlaylist() ? currentPlaylist().name : '';
}

Template.playlistItems.items = function () {
  if (!currentPlaylist()) return [];
  return player.items(currentPlaylist());
}


// PlaylistItem
// --------------------------------------------------------

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

  var scrubberWidth = $('.playlistItem .container').width();
  return Math.floor(scrubberWidth * progress);
}

Template.playlistItem.events = {
  'click .container .clickArea': function(e) {
    e.preventDefault();

    var $container = $(e.target).parents('.container'),
        offsetLeft = $container.offset().left,
        relativeX = e.clientX - offsetLeft,
        progress = relativeX / $container.width(),
        id = getDataId(e.target);
    
    player.play(id, progress);
  },

  'click .playPauseIcon .clickArea': function(e) {
    e.preventDefault();

    var id = getDataId(e.target);
    if (player.isPlaying(id))
      player.pause(id);
    else
      player.play(id);
  },

  // Start drag
  'mousedown .moveIcon .clickArea': function(e) {

    e.preventDefault();
    dragManager.start(e.pageX, e.pageY, createPlaylistItemRectangles())
  }
}

function createPlaylistItemRectangles() {
  var rectangles = {};
  $(".playlistItem").each(function() {
    var id = getDataId(this),
        left = $(this).position().left,
        top = $(this).position().top,
        width = $(this).width(),
        height = $(this).height(),
        rectangle = { x1: left, y1: top, x2: left + width, y2: top + height };
    rectangles[id] = rectangle;
  })
  return rectangles;
}  

dragManager.drop = function(dragToken, dropToken) {
  player.move(dragToken, dropToken);
}

$(document).mouseup(function(e) {
  dragManager.mouseup();
})

$(document).mousemove(function(e) {
  dragManager.mousemove(e.pageX, e.pageY);
});

Template.playlistItem.offsetX = function() {
  return dragManager.getDeltaX(this._id);
}

Template.playlistItem.offsetY = function() {
  return dragManager.getDeltaY(this._id);
}

Template.playlistItem.placeHolderClassBelow = function() {
  return this._id == dragManager.getHoveredToken() ? 'placeholder' : 'hidden';
}

// Retrieves the database id for a PlaylistItem HTML element 
// or one of it's children.
function getDataId(element) {
  var $parents = $(element).parents('.playlistItem');
  if(!$parents.length) return element.id;
  return $parents.attr('id');
}

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
      player.add(track.name, track.href, track.duration, currentPlaylist()._id);
      $('#playlistView .new').val('').focus();
    }
  });
}