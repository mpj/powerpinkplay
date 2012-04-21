var Playlists = new Meteor.Collection("playlists"),
    PlaylistItems = new Meteor.Collection("playlist_items");



if (Meteor.is_client) {

  var ClientRouter = Backbone.Router.extend({
      routes: {
          "p/:simple_name/" :       "getPlayListBySimpleName"
          //":route/:action/"  :       "get_route"
      },

      /* Generic routes */
      getPlayListBySimpleName: function( simpleName ) {
        console.log("getPlayListBySimpleName", simpleName)
        Session.set("currentPlayListSimpleName", simpleName); 
      }
  });
 

  Meteor.router = new ClientRouter;
  Backbone.history.start({pushState: true});


  Meteor.autosubscribe(function() {
    var simpleName = Session.get('currentPlayListSimpleName');
    Meteor.subscribe('playlists', simpleName, function () {

      if (simpleName) {
        var list = Playlists.findOne({name_simple: simpleName});
        if (list)
          Session.set('currentPlayList', list)
      }

    });
  });

  Meteor.autosubscribe(function() {
    var playlist = Session.get('currentPlayList');
    var id;
    if (!playlist) 
      id = 0;
    else 
      id = playlist._id;

    Meteor.subscribe('playlist_items', id, function () {

        var items = PlaylistItems.find({playlist_id: id}).fetch();
        console.log("Fidning", items)
        Session.set('currentPlayListItems', items)

    });
  });



  Template.createPlayList.viewClass = function () {
    return Session.get('currentPlayList') ? 'hidden' : '';
  }

  Template.playlist.viewClass = function () {
    return Session.get('currentPlayList') ? '' : 'hidden';
  }

  Template.playlist.playListName = function () {
    var playList = Session.get('currentPlayList')
    return !!playList ? playList.name : '';
  }

  Template.playlist.playlistItems = function () {
    var playlist = Session.get('currentPlayList');
    if (!playlist) return [];
    return PlaylistItems.find({ playlist_id: playlist._id}).fetch()
  }

  Template.createPlayList.greeting = function () {
    return "Welcome to collabplay.";
  };

  Template.createPlayList.events = {
    'click .do' : function (e) {
      if (typeof console !== 'undefined')
        console.log("You pressed the button");
      var playListName = $('#createPlayListView .name').val();
      if (playListName.length == 0 ) return;
      var playListNameSimple = playListName.replace(" ", "").toLowerCase();
      Meteor.router.navigate("p/" + playListNameSimple + "/", {trigger: true});
      var id = Playlists.insert({ 
        name: playListName, 
        name_simple: playListNameSimple 
      });
      
    }
  };

  setTimeout(function() {
    $('#playlistView .new').typeahead({

      property: 'name',
      
      source: function (typeahead, query) {
        var uri = "http://ws.spotify.com/search/1/track.json?q=" + query;
        console.log("calling")
        Meteor.http.call("GET", uri, {}, function (error, result) {
          var data = JSON.parse(result.content);
          var simpleTracks = [];
          for (var i=0;i<data.tracks.length;i++) {
            var track = data.tracks[i];
            simpleTracks.push({
              name: track.name,
              href: track.href
            });
          }
          return typeahead.process(simpleTracks);
        });
      },

      onselect: function(simpleTrack) {
        simpleTrack.playlist_id = Session.get('currentPlayList')._id;
        console.log("inserting", simpleTrack)
        PlaylistItems.insert(simpleTrack)
      }
    });
  }, 2000);

}



if (Meteor.is_server) {

  // Publish all items for requested list_id.
  Meteor.publish('playlists', function (simpleName) {
    return Playlists.find({name_simple: simpleName});
  });

  // Publish all items for requested list_id.
  Meteor.publish('playlist_items', function (playlistId) {
    var cursor = PlaylistItems.find({playlist_id: playlistId});
    console.log("found", cursor.fetch())
    return cursor;
  });



  Meteor.startup(function () {
    // code to run on server at startup
  });
}