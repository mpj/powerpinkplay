// Base class for the presenters.
// Kind of overkill, and is mostly just to play
// around with inheritance, for kicks, and to prevent the
// _getCurrentPlaylist function from just lying around somewhere.

BasePresenter = function() {

  // Private

  // Forwards forwards calls on the template
  // to the presenter, with correct context, by creating 
  // wrapper functions on the template.
  var forwardCall = function(funcName, template, presenter) {
    template[funcName] = function() { 
      return presenter[funcName](this);
    }
  }

  // Priviliged
  this.glue = function(template) {
    for (var propName in this) {
      if (!_.isFunction(this[propName])) continue;
      forwardCall(propName, template, this);
    }
  }

}

BasePresenter.prototype = {

  _getCurrentPlaylist: function() {
    var simpleName  = Session.get('currentPlayListSimpleName'),
      selector  = { name_simple: simpleName };
    return Playlists.findOne(selector);
  }
}