serverTime = new ServerTime();
player = new Player(serverTime);

function currentPlaylist() {
  return Playlists.findOne({ 
    name_simple: 
      Session.get('currentPlayListSimpleName')
  });
}
