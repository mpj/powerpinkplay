/**
 *  Mixin for supporting typeahead behaviour in reactive 
 *  presenters. Is generalized and not tied to PowerPinkPlay. 
 */

TypeAheadMixin = {
  
  /**
   * Executes the query. 
   * 
   *  searchFunction is a function that accepts a query and a callback.
   *  The first argument to the callback will be any error that occured, 
   *  and the second argument an array of results. 
   */ 
  queryTypeAhead: function(query, searchFunction) {
    
    Session.set('typeAheadIsLoading', true);

    // Wrap within a clearing timeout
    // to prevent API spamming
    if (this._timeoutHandle) clearTimeout(this._timeoutHandle);
    var sess = Session;
    this._timeoutHandle = Meteor.setTimeout(function() {
      searchFunction(query, function(error, results) {
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