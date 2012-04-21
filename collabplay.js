if (Meteor.is_client) {
  Template.hello.greeting = function () {
    return "Welcome to collabplay.";
  };

  Template.hello.events = {
    'click input' : function () {
      // template data, if any, is available in 'this'
      Meteor.http.call("GET", "http://ws.spotify.com/search/1/track.json?q=foo",
                 //{data: {some: "json", stuff: 1}},
                 function (error, result) {
                   if (result.statusCode === 200) {
                    console.log("result", JSON.parse(result.content))
                     Session.set("tracks", true);
                   }
                 });

      if (typeof console !== 'undefined')
        console.log("You pressed the button");
    }
  };
}

if (Meteor.is_server) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}