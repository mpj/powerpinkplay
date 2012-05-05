// Variables global in the client.
// Normally, I don't like global variables. If I work more on this
// I'd probably create a very simple IoC container to keep 
// the global stuff in one place.

serverTime = new ServerTime();
player = new Player(serverTime);
spotifyTrackSearch = new SpotifyTrackSearch;

var KEY_CODE_ARROW_DOWN = 40,
    KEY_CODE_ARROW_UP   = 38,
    KEY_CODE_ENTER      = 13;