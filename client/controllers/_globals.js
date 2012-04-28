serverTime = new ServerTime();
player = new Player(serverTime);
spotifySearch = new SpotifySearch

function currentPlaylist() {
  return Playlists.findOne({ 
    name_simple: 
      Session.get('currentPlayListSimpleName')
  });
}
