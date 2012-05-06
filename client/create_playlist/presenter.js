CreatePlaylistPresenter.prototype = new BasePresenter();
CreatePlaylistPresenter.prototype.constructor = CreatePlaylistPresenter;

function CreatePlaylistPresenter(player) {
  
  // Priviliged:
  this.isVisible = function() {
    return !self._getCurrentPlaylist();
  }
  
  this.nameInputValueChanged = function(newValue) {
    nameInputValue = newValue.trim();
  }

  this.nameInputEnterKeyPressed = function() {
    createPlaylist();
    nameInputValue = '';  
  }

  this.buttonClicked = function() {
    createPlaylist();
  }
  
  // Private:

  var self = this,
      nameInputValue = '';
      
  var createPlaylist = function() {
    if (nameInputValue.length == 0) return;
    var playlist = player.create(nameInputValue),
        url = "p/" + playlist.name_simple;
    Meteor.router.navigate(url, { trigger: true } );
  }
  
}

