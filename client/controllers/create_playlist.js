Template.createPlaylist.isVisible = function () {
  return !currentPlaylist();
}

function createPlaylist() {
  var name = $('#createPlaylistView .name').val().trim();
  if (name.length == 0) return;
  var playlist = player.create(name);
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