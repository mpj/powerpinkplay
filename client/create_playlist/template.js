(function() {
  var presenter = new CreatePlaylistPresenter(player);

  Template.createPlaylist.isVisible = presenter.isVisible;

  Template.createPlaylist.events = {
    
    'click input[type=button]' : function (e) { 
      presenter.buttonClicked();
    },
    
    'keyup .name': function(e) {
      console.log(presenter)
      if (e.keyCode == KEY_CODE_ENTER) 
        presenter.nameInputEnterKeyPressed();
      else
        presenter.nameInputValueChanged(e.target.value);
    }
  }
})();
