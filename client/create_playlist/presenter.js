CreatePlaylistPresenter = function(player) {
  this._nameInputValue = null;
  this._player = player;
}

CreatePlaylistPresenter.prototype = {

  isVisible: function() {
    return !currentPlaylist();
  },
  
  nameInputValueChanged: function(newValue) {
    this._nameInputValue = newValue.trim();
  },

  nameInputEnterKeyPressed: function() {
    this._createPlaylist();
  },

  buttonClicked: function() {
    this._createPlaylist();
  },

  _createPlaylist: function() {
    var name = this._nameInputValue;
    if (name.length == 0) return;
    var playlist = this._player.create(name);
    Meteor.router.navigate("p/" + playlist.name_simple + "/", { trigger: true });
  }
  
}