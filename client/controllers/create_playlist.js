Template.createPlaylist.viewClass = function () {
  return currentPlaylist() ? 'hidden' : '';
}

function createPlaylist() {
  var playlist = player.create($('#createPlaylistView .name').val());
  Meteor.router.navigate("p/" + playlist.name_simple + "/", {trigger: true});
}

Template.createPlaylist.events = {
  
  'click .do' : function (e) { 
    createPlaylist(); 
  },
  
  'keydown .name': function(e) {
    if (e.keyCode == KEY_CODE_ENTER) createPlaylist();
  }
};