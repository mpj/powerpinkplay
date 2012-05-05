// The client router, using Backbone routing.
// http://documentcloud.github.com/backbone/#Router
var ClientRouter = Backbone.Router.extend({

    routes: {
      '':               'getRoot',
      'p/:simple_name': 'getPlayListBySimpleName'
    },

    getRoot: function() {
      // What view is visible is determined by 
      // whether or not currentPlayListSimpleName 
      // is set in Session or not. 
      Session.set("currentPlayListSimpleName", null);
    },

    getPlayListBySimpleName: function( simpleName ) {
      // This will trigger the PlaylistPresenter to display
      // its view, and to populate it with the correct playlist.
      Session.set("currentPlayListSimpleName", simpleName); 
    }

});

Meteor.router = new ClientRouter;
Backbone.history.start( { pushState: true } );