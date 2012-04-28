DragManager = function() {
  this._dragged = null;
  this._rectangles = {};
}

DragManager.prototype =  {
  start: function(x, y, token) {
    this._dragged = token;
    Session.set('dragOriginX', x);
    Session.set('dragOriginY', y);
  },
  mousemove: function(x, y) {
    Session.set('mouseX', x);
    Session.set('mouseY', y);
  },
  getDeltaY: function(token) { 
    if (this._dragged != token) return 0;
    return Session.get('mouseY') - Session.get('dragOriginY');
  },
  getDeltaX: function(token) { 
    if (this._dragged != token) return 0;
    return Session.get('mouseX') - Session.get('dragOriginX');
  },
  mouseup: function() {
    var dropToken = this.hoveredToken();
    if (dropToken && this.drop)
      this.drop(this._dragged, dropToken);
    Session.set('dragOriginX', null);
    Session.set('dragOriginY', null);
    this._dragged = null;

  },
  clearRectangles: function() {
    this._rectangles = {};
  },
  setRectangle: function(token, rectangle) {
    if ((rectangle == null) || (rectangle.x1 && rectangle.x2 && rectangle.y1 && rectangle.y2))
      this._rectangles[token] = rectangle;
    else
        throw new Error('Invalid rectangle value.');
  },
  hoveredToken: function() {
    if (!Session.get('dragOriginX')) return null;
    var mx = Session.get('mouseX'),
        my = Session.get('mouseY');
    for (var token in this._rectangles) {
      if (token == this._dragged) continue;
      var r = this._rectangles[token];
      if(my > r.y1 && my < r.y2 && mx > r.x1 && mx < r.x2)
        return token;
    }
    return null;
  }
}