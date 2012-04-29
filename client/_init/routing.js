var ClientRouter = Backbone.Router.extend({
    routes: {
        "p/:simple_name/": "getPlayListBySimpleName"
    },

    getPlayListBySimpleName: function( simpleName ) {
      Session.set("currentPlayListSimpleName", simpleName); 
    }
});

Meteor.router = new ClientRouter;
Backbone.history.start({pushState: true});