/**
 *  Mixin for supporting typeahead behaviour in reactive 
 *  presenters. Is generalized and not tied to PowerPinkPlay. 
 */

TypeAheadMixin = {
  
  /**
   * Executes the query. 
   * Requires _searcher to be defined on the mixed-in class,
   *  which is an object that defines search(query, callback).
   *  
   *  TODO: Make the _searcher some kind of interface, most likely
   *  a base class that SpotifyTrackSearch and RdioSearch etc. inherits from.
   *  Alternatively, make it more simple and just an argument to the function.
  */ 
  queryTypeAhead: function(query) {

    if (!this._searcher || !this._searcher.search)
      throw new Error("TypeAheadMixin requires _searcher to be defined.")
    
    Session.set('typeAheadIsLoading', true);

    // Wrap within a clearing timeout
    // to prevent API spamming
    if (this._timeoutHandle) clearTimeout(this._timeoutHandle);
    var that = this, sess = Session;
    this._timeoutHandle = Meteor.setTimeout(function() {
      that._searcher.search(query, function(error, results) {
        sess.set('typeAheadIsLoading', false);
        if(error)
          return; // Do nothing, yet.
        if (results.length == 0)
          return; // Don't replace with empty data.

        results = results.slice(0, 5); // Pick the first five
        sess.set('typeAheadSelectedIndex', 0)
        sess.set('typeAheadResults', results);
      })
    }, 250);

  },

  typeAheadResults: function() {
    if (!Session.get('typeAheadVisible')) return [];
    return Session.get('typeAheadResults') || [];
  },

  isTypeAheadSelected: function(item) {
    return item == this._getSelectedTypeAhead();
  },

  isTypeAheadLoading: function() {
    return !!Session.get('typeAheadIsLoading');
  },

  clearTypeAhead: function() {
    return Session.set('typeAheadResults', null);
  },

  hideTypeAhead: function() {
    Session.set('typeAheadVisible', false);
  },

  showTypeAhead: function() {
    Session.set('typeAheadVisible', true);
  },

  selectNextTypeAhead: function() {
    this._typeAheadMoveIndex(+1);
  },

  selectPreviousTypeAhead: function() {
    this._typeAheadMoveIndex(-1);
  },

  _getSelectedTypeAhead: function() {
    if(Session.get('typeAheadSelectedIndex') < 0) return null;
    var results = Session.get('typeAheadResults');
    if(!results) return null;
    return results[Session.get('typeAheadSelectedIndex')];
  },

  _typeAheadMoveIndex: function(delta) {
    var newIndex = Session.get('typeAheadSelectedIndex') + delta;
    var results = Session.get('typeAheadResults');
    if(results && results[newIndex])
      Session.set('typeAheadSelectedIndex', newIndex)  
  } 

}