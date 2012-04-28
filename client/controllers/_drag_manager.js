DragManager = function() {
  this._dragged = null;
  this._hitAreas = {};
}

DragManager.prototype =  {
  start: function(x, y, hitAreas) {
    this._hitAreas = hitAreas;
    this._dragged = this._tokenAt(x, y);
    Session.set('dragOriginX', x);
    Session.set('dragOriginY', y);
  },
  mousemove: function(x, y) {
    Session.set('mouseX', x);
    Session.set('mouseY', y);
  },
  mouseup: function() {
    var dropToken = this.getHoveredToken();
    if (dropToken && this.drop)
      this.drop(this._dragged, dropToken);
    Session.set('dragOriginX', null);
    Session.set('dragOriginY', null);
    this._dragged = null;
  },
  getDeltaY: function(token) { 
    if (this._dragged != token) return 0;
    return Session.get('mouseY') - Session.get('dragOriginY');
  },
  getDeltaX: function(token) { 
    if (this._dragged != token) return 0;
    return Session.get('mouseX') - Session.get('dragOriginX');
  },
  getHoveredToken: function() {
    if (!Session.get('dragOriginX')) return null;
    var token = this._tokenAt(Session.get('mouseX'), Session.get('mouseY'));
    if (token == this._dragged) return null;
    return token;
  },
  _tokenAt: function(x, y) {
    for (var token in this._hitAreas) {
      var r = this._hitAreas[token];
      if(y > r.y1 && y < r.y2 && x > r.x1 && x < r.x2)
        return token;
    }
    return null;
  }
}