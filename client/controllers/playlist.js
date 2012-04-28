

// This view should only be visible if we have navigated to a playlist.
Template.playlist.viewClass = function () {
  return player.currentPlaylist() ? '' : 'hidden';
}

Template.playlistHeader.playlistName = function () {
  return !!player.currentPlaylist() ? player.currentPlaylist().name : '';
}

Template.playlistItems.items = function () {
  if (!player.currentPlaylist()) return [];
  Meteor.setTimeout(attachTypeAhead, 1); // FIXME: UGLY!
  return player.items(player.currentPlaylist());
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

  'mousedown .moveIcon .clickArea': function(e) {
    e.preventDefault();
    Session.set('dragItemId', getDataId(e.target));
    Session.set('dragOriginX', e.clientX);
    Session.set('dragOriginY', e.clientY);
  }
}

$(document).mouseup(function(e) {
  var afterId = getHoveredItemId();
  if (afterId)
    player.move(Session.get('dragItemId'), afterId);

  Session.set('dragItemId', null);
  Session.set('dragOriginX', null);
  Session.set('dragOriginY', null);
})

$(document).mousemove(function(e) {
  Session.set('mouseX', e.clientX);
  Session.set('mouseY', e.clientY);
});


Template.playlistItem.offsetX = function() {
  return calculateOffset(this._id, false)
}

Template.playlistItem.offsetY = function() {
  return calculateOffset(this._id, true)
}

function calculateOffset(itemId, vertical) {
  if (itemId != Session.get('dragItemId')) return 0;
  var xOrY = vertical ? "Y" : "X";
  var delta = Session.get('mouse' + xOrY) - Session.get('dragOrigin' + xOrY);
  return delta;
}

Template.playlistItem.placeHolderClassBelow = function() {
  return this._id == getHoveredItemId() ? 'placeholder' : 'hidden';
}

function getHoveredItemId() {
  if (!Session.get('dragOriginX')) return null;
  var mx = Session.get('mouseX'),
      my = Session.get('mouseY'),
      hoveredId = null;

  var $staticItems = $('.playlistItem').not('#'+Session.get('dragItemId'));

  $staticItems.each(function() {
    var offset = $(this).offset(),
        x1 = offset.left,
        y1 = offset.top,
        x2 = offset.left + $(this).width(),
        y2 = offset.top  + $(this).height(),
        isInsideBox = my > y1 && my < y2 && mx > x1 && mx < x2;
    if(isInsideBox) {
      hoveredId = this.id;
      return;
    }
  })
  var end = Number(new Date());
  return hoveredId;
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
      player.add(track.name, track.href, track.duration, player.currentPlaylist()._id);
      $('#playlistView .new').val('').focus();
    }
  });
}