SpotifySearch = function() {}

SpotifySearch.prototype = {

  track: function(query, callback) {
    var uri = "http://ws.spotify.com/search/1/track.json?q=" + query;
    Meteor.http.call("GET", uri, {}, function (error, result) {
      
      if(error) {
        // Fail silently, for now.
        return;
      }

      var data = JSON.parse(result.content);
      var simpleTracks = [];
      for (var i=0;i<data.tracks.length;i++) {
        var track = data.tracks[i];
        simpleTracks.push({
          name:   track.name + " (" + track.artists[0].name + ")",
          href:   track.href,
          duration: track.length*1000 // convert to ms
        });
      }
      return callback(simpleTracks);

    }); 
  }
  
}