serverTime = new ServerTime();
player = new Player(serverTime);
spotifyTrackSearch = new SpotifyTrackSearch;
typeAhead = new TypeAheadHelper(spotifyTrackSearch);

function currentPlaylist() {
  return Playlists.findOne({ 
    name_simple: 
      Session.get('currentPlayListSimpleName')
  });
}
