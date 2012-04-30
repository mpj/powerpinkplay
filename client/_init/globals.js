serverTime = new ServerTime();
player = new Player(serverTime);
spotifyTrackSearch = new SpotifyTrackSearch;
typeAhead = new TypeAheadHelper(spotifyTrackSearch);

var KEY_CODE_ARROW_DOWN = 40,
    KEY_CODE_ARROW_UP   = 38,
    KEY_CODE_ENTER      = 13;