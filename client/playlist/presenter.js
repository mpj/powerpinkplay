PlaylistPresenter.prototype = new BasePresenter();
PlaylistPresenter.prototype.constructor = PlaylistPresenter;

function PlaylistPresenter(player, searcher) {
  
  this._player = player;
  this._searcher = searcher;
  
}

_.extend(PlaylistPresenter.prototype, DragMixin);
_.extend(PlaylistPresenter.prototype, TypeAheadMixin);
_.extend(PlaylistPresenter.prototype, {

  // Playlist itself ...

  isVisible: function() {
    // This view should only be visible if 
    // we have navigated to a playlist.
    return !!this._getCurrentPlaylist();
  },

  headerText: function() {
    return !!this._getCurrentPlaylist() ? this._getCurrentPlaylist().name : '';
  },


  // Items ... 

  items: function () {
    if (!this._getCurrentPlaylist()) return [];
    return player.items(this._getCurrentPlaylist());
  },

  isTrashVisible: function() {
    return this._dragHelper.getIsDragging();
  },


  // Typeahead...

  addPlaylistItemTextInputBlur: function() {
    this._hideTypeAhead();
  },

  addPlaylistItemTextInputFocus: function() {
    this._showTypeAhead();
  },

  addPlaylistItemTextInputEnterPressed: function() {
    var selected = this._getSelectedTypeAhead(),
        playlistId = this._getCurrentPlaylist()._id;
    if(!selected) return;
    this._player.add(
      selected.label, 
      selected.data.href, 
      selected.data.duration, 
      playlistId
    );
    this.clearTypeAhead();
  },

  addPlaylistItemTextInputArrowDown: function() {
    this._typeAheadHelper.selectNext();
  },

  addPlaylistItemTextInputArrowUp: function() {
    this._typeAheadHelper.selectPrevious();
  },

  playPauseIconClass: function(item) {
    return this._player.isPlaying(item) ? 'icon-pause icon-white' : 'icon-play icon-white';
  },

  playPauseIconClicked: function(item) {
    if (player.isPlaying(item))
      player.pause(item);
    else
      player.play(item);
  },

  needleProgress: function(item) {

    var progress = this._player.getProgress(item);
    if (progress == 0) return 0;
    
    if (this._player.isPlaying(item)) { 
      var ctx = Meteor.deps.Context.current;
      Meteor.setTimeout(function() {
        ctx.invalidate();
      }, 250);
    }

    return progress;
  },

  containerClicked: function(item, progress) {
    this._player.play(item, progress);
  },

  _drop: function(dragToken, dropToken) {
    if (dropToken == "trash")
      player.remove(dragToken);
    else
      player.move(dragToken, dropToken);
  }
  
})
