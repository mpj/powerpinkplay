var dragManager = new DragManager;

// This view should only be visible if we have navigated to a playlist.
Template.playlist.viewClass = function () {
  return currentPlaylist() ? '' : 'hidden';
}

Template.addPlaylistItem.typeAheadResults = function() {
  console.log("dsdsa",Session.get('typeAheadFocus'))
  if (!Session.get('typeAheadFocus')) return [];
  return typeAhead.results();
}

Template.addPlaylistItem.class = function() {
  var isSelected = typeAhead.isSelected(this);
  return isSelected ? 'option selected' : 'option';
}

Template.addPlaylistItem.loading = typeAhead.isLoading;

Template.addPlaylistItem.events = {
  'blur input': function(e) {
    Session.set('typeAheadFocus', false);
  },
  'focus input': function(e) {
    Session.set('typeAheadFocus', true);
  },
  'keyup input': function(e) {
    if (e.keyCode == KEY_CODE_ENTER) {
      var selected = typeAhead.getSelected();
      var playlistId = currentPlaylist()._id;
      player.add(selected.label, selected.data.href, selected.data.duration, playlistId);
      $(e.target).val('').focus();
      typeAhead.clear();
    } else if (e.keyCode == KEY_CODE_ARROW_DOWN)
      typeAhead.selectNext();
    else if(e.keyCode == KEY_CODE_ARROW_UP)
      typeAhead.selectPrevious();
    else
      typeAhead.query(e.target.value);
  },
  
}

Template.playlistHeader.playlistName = function () {
  return !!currentPlaylist() ? currentPlaylist().name : '';
}

Template.playlistItems.items = function () {
  if (!currentPlaylist()) return [];
  return player.items(currentPlaylist());
}

Template.playlistItems.isDragging = function() {
  return dragManager.getIsDragging();
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

  var scrubberWidth = $('.playlistItem .container').width();
  return Math.floor(scrubberWidth * progress);
}

Template.playlistItem.events = {
  
  'click .playPauseIcon .clickArea': function(e) {
    e.preventDefault();

    var id = getDataId(e.target);
    if (player.isPlaying(id))
      player.pause(id);
    else
      player.play(id);
  },

  'click .container .clickArea': function(e) {
    e.preventDefault();

    // Find out the relative position the container was
    // clicked and scrub to the equivalent place in the track.
    var $container = $(e.target).parents('.container'),
        offsetLeft = $container.offset().left,
        relativeX = e.clientX - offsetLeft,
        progress = relativeX / $container.width(),
        id = getDataId(e.target);
    player.play(id, progress);

  },

  'mousedown .moveIcon .clickArea': function(e) {
    e.preventDefault();

    // When the user presses down on the moveIcon, 
    // we want to initiate dragging.

    // First, construct hit area rectangles 
    // for all playlistitems.
    var hitAreas = {};
    $(".playlistItem").each(function() {
      hitAreas[getDataId(this)] = getRectangle(this);
    });
    hitAreas['trash'] = getRectangle($('#trash'));
    dragManager.start(e.pageX, e.pageY, hitAreas)
  }
}

Template.playlistItem.placeHolderClassBelow = function() {
  return this._id == dragManager.getHoveredToken() ? 'placeholder' : 'hidden';
}

Template.playlistItem.offsetX = function() {
  return dragManager.getDeltaX(this._id);
}

Template.playlistItem.offsetY = function() {
  return dragManager.getDeltaY(this._id);
}

dragManager.drop = function(dragToken, dropToken) {
  console.log(dropToken)
  if (dropToken == "trash")
    player.remove(dragToken);
  else
    player.move(dragToken, dropToken);
}

// Forward required mousevents to DragManager instance.

$(document)
  .mouseup(function() {
    dragManager.mouseup();
  })
  .mousemove(function(e) {
    dragManager.mousemove(e.pageX, e.pageY);
  });

// Gets the rectangle of a html element,
// absolutely positioned on the document.
function getRectangle(element) {
  var left = $(element).position().left,
      top = $(element).position().top,
      width = $(element).width(),
      height = $(element).height();
  return { x1: left, y1: top, x2: left + width, y2: top + height };
}

// Retrieves the database id for a PlaylistItem HTML element 
// or one of it's children.
function getDataId(element) {
  var $parents = $(element).parents('.playlistItem');
  if(!$parents.length) return element.id;
  return $parents.attr('id');
}
