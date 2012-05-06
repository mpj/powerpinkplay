PlaylistPresenter.prototype = new BasePresenter();
PlaylistPresenter.prototype.constructor = PlaylistPresenter;

_.extend(PlaylistPresenter.prototype, DragMixin);
_.extend(PlaylistPresenter.prototype, TypeAheadMixin);

function PlaylistPresenter(player) {
  
  var self = this;

  this.isVisible = function() {
    // This view should only be visible if 
    // we have navigated to a playlist.
    return !!self._getCurrentPlaylist();
  }

  this.headerText = function() {
    return !!self._getCurrentPlaylist() ? self._getCurrentPlaylist().name : '';
  }

  this.items = function () {
    if (!self._getCurrentPlaylist()) return [];
    return player.items(self._getCurrentPlaylist());
  }

  this.isTrashVisible = function() {
    return self.isDragging();
  }

  this.isPlaceholderVisible = function(item) {  
    return self.isHoveringBelow(item);
  }

  this.playProgress = function(item) {

    var progress = player.getProgress(item);
    if (progress == 0) return 0;
    
    if (player.isPlaying(item)) { 
      var ctx = Meteor.deps.Context.current;
      Meteor.setTimeout(function() {
        ctx.invalidate();
      }, 250);
    }

    return progress;
  }

  this.playPauseIconClass = function(item) {
    return player.isPlaying(item) ? 'icon-pause icon-white' : 'icon-play icon-white';
  }

  this.addPlaylistItemTextInputBlur = function() {
    self.hideTypeAhead();
  }

  this.addPlaylistItemTextInputFocus = function() {
    self.showTypeAhead();
  }

  this.addPlaylistItemTextInputEnterPressed = function() {
    var selected = self._getSelectedTypeAhead(),
        playlistId = self._getCurrentPlaylist()._id;
    if(!selected) return;
    player.add(
      selected.label, 
      selected.data.href, 
      selected.data.duration, 
      playlistId
    );
    self.clearTypeAhead();
  },

  this.playPauseIconClicked = function(item) {
    if (player.isPlaying(item))
      player.pause(item);
    else
      player.play(item);
  },

  this.playlistItemClicked = function(item, progress) {
    player.play(item, progress);
  },
  
  // This is an event handler, called by the DragMixin
  // upon drop. While this should not be accessed by the view,
  // it still needs to be priviliged to access the private player.
  this._drop = function(dragToken, dropToken) {
    if (dropToken == "trash")
      player.remove(dragToken);
    else
      player.move(dragToken, dropToken);
  }
  
}
