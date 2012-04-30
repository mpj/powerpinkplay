PlaylistPresenter.prototype = new BasePresenter();
PlaylistPresenter.prototype.constructor = PlaylistPresenter;

function PlaylistPresenter(player, dragHelper, typeAheadHelper) {
  
  this._typeAheadHelper = typeAheadHelper;
  this._player = player;

  this._dragHelper = dragHelper;
  this._dragHelper.drop = function(dragToken, dropToken) {
    if (dropToken == "trash")
      player.remove(dragToken);
    else
      player.move(dragToken, dropToken);
  }
  
}

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

  typeAheadResults: function() {
    if (!Session.get('typeAheadFocus')) return [];
    return this._typeAheadHelper.results();
  },

  isTypeAheadSelected: function(item) {
    return this._typeAheadHelper.isSelected(item);
  },

  isLoading: function(item) {
    return this._typeAheadHelper.isLoading(item);
  },

  addPlaylistItemTextInputBlur: function() {
    Session.set('typeAheadFocus', false);
  },

  addPlaylistItemTextInputFocus: function() {
    Session.set('typeAheadFocus', true);
  },

  addPlaylistItemTextInputEnterPressed: function() {
    var selected = this._typeAheadHelper.getSelected(),
        playlistId = this._getCurrentPlaylist()._id;
    if(!selected) return;
    this._player.add(
      selected.label, 
      selected.data.href, 
      selected.data.duration, 
      playlistId
    );
    this._typeAheadHelper.clear();
  },

  addPlaylistItemTextInputArrowDown: function() {
    this._typeAheadHelper.selectNext();
  },

  addPlaylistItemTextInputArrowUp: function() {
    this._typeAheadHelper.selectPrevious();
  },

  addPlaylistItemTextInputChanged: function(val) {
    this._typeAheadHelper.query(val);
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

  dragStarted: function(x, y, hitAreas) {
    this._dragHelper.start(x, y, hitAreas);
  },

  isPlaceholderVisible: function(item) {
    return item._id == this._dragHelper.getHoveredToken();
  },

  getOffsetX: function(item) {
    return this._dragHelper.getDeltaX(item._id);
  },

  getOffsetY: function(item) {
    return this._dragHelper.getDeltaY(item._id);
  },

  mouseup: function() {
    this._dragHelper.mouseup()
  },

  mousemove: function(x, y) {
    this._dragHelper.mousemove(x, y);    
  }
  
})
