TypeAheadMixin = {
  
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
          return; // Don't replace with empty

        sess.set('typeAheadSelectedIndex', 0)
        sess.set('typeAheadResults', results.slice(0, 5));
      })
    },250);

    
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
    this._moveIndex(+1);
  },

  selectPreviousTypeAhead: function() {
    this._moveIndex(-1);
  },

  _getSelectedTypeAhead: function() {
    if(Session.get('typeAheadSelectedIndex') < 0) return null;
    var results = Session.get('typeAheadResults');
    if(!results) return null;
    return results[Session.get('typeAheadSelectedIndex')];
  },

  _moveIndex: function(delta) {
    var newIndex = Session.get('typeAheadSelectedIndex') + delta;
    var results = Session.get('typeAheadResults');
    if(results && results[newIndex])
      Session.set('typeAheadSelectedIndex', newIndex)  
  } 

}