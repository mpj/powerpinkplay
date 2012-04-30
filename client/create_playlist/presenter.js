CreatePlaylistPresenter.prototype = new BasePresenter();
CreatePlaylistPresenter.prototype.constructor = CreatePlaylistPresenter;

function CreatePlaylistPresenter(player) {
  this._nameInputValue = null;
  this._player = player;
}

_.extend(CreatePlaylistPresenter.prototype, {

  isVisible: function() {
    return !this._getCurrentPlaylist();
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
  
})