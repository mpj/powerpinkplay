DragMixin = {

  dragStarted: function(x, y, hitAreas) {
    this._hitAreas = hitAreas;
    this._draggedId = this._idAt(x, y);
    Session.set('dragOriginX', x);
    Session.set('dragOriginY', y);
  },

  mousemove: function(x, y) {
    Session.set('mouseX', x);
    Session.set('mouseY', y);
  },

  mouseup: function() {
    var dropId = this._getHoveredId();
    if (dropId && this._drop)
      this._drop(this._draggedId, dropId);
    Session.set('dragOriginX', null);
    Session.set('dragOriginY', null);
    this._draggedId = null;
  },

  dragDeltaY: function(idOrItem) {
    var id = idOrItem._id || idOrItem;
    if (this._draggedId != id) return 0;
    return Session.get('mouseY') - Session.get('dragOriginY');
  },

  dragDeltaX: function(idOrItem) { 
    var id = idOrItem._id || idOrItem;
    if (this._draggedId != id) return 0;
    return Session.get('mouseX') - Session.get('dragOriginX');
  },

  isHovering: function(idOrItem) {
    var id = idOrItem._id || idOrItem;
    return this._getHoveredId() == id;
  },
  
  isDragging: function() {
    return !!Session.get('dragOriginX');
  },

  _getHoveredId: function() {
    if (!Session.get('dragOriginX')) return null;
    var id = this._idAt(Session.get('mouseX'), Session.get('mouseY'));
    if (id == this._draggedId) return null;
    return id;
  },

  _idAt: function(x, y) {
    for (var id in this._hitAreas) {
      var r = this._hitAreas[id];
      if(y > r.y1 && y < r.y2 && x > r.x1 && x < r.x2)
        return id;
    }
    return null;
  }

}