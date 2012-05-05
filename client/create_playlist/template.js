(function() {
  var presenter = new CreatePlaylistPresenter(player);

  _.extend(Template.createPlaylist, {
    isVisible: function() { return presenter.isVisible() }
  });

  Template.createPlaylist.events = {
    
    'click input[type=button]' : function (e) { 
      presenter.buttonClicked();
    },
    
    'keyup .name': function(e) {
      if (e.keyCode == KEY_CODE_ENTER) 
        presenter.nameInputEnterKeyPressed();
      else
        presenter.nameInputValueChanged(e.target.value);
    }
  }
})();
