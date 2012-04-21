var Playlists = new Meteor.Collection("playlists");



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
          var list = Playlists.findOne({name_simple: simpleName}, function() {
            console.log("callback?", arguments)
          });
          console.log("playlists.subscribe", list)
          if (list)
            Session.set('currentPlayList', list)
        }

      });
  });



  Template.createPlayList.viewClass = function () {
    return Session.get('currentPlayList') ? 'hidden' : '';
  }

  Template.playList.viewClass = function () {
    return Session.get('currentPlayList') ? '' : 'hidden';
  }

  Template.playList.playListName = function () {
    var playList = Session.get('currentPlayList')
    return !!playList ? playList.name : '';
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



}

if (Meteor.is_server) {

  // Publish all items for requested list_id.
  Meteor.publish('playlists', function (simpleName) {
    return Playlists.find({name_simple: simpleName});
  });


  Meteor.startup(function () {
    // code to run on server at startup
  });
}