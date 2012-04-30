/*
 * Mixin that helps implement drag-n-drop
 * in reactive presenters. This is generalized
 * and not tied to PowerPinkPlay, and can be used
 * for future senarios. 
 * 
 * 
 * TODO: Change naming to reduce chance for conflicts
 * TODO: Consider creating your own reactive context, 
 * instead of piggybacking on Session.
 *
 */
DragMixin = {

  /**
   *  dragStarted
   *  
   *  Call to initiate drag. After calling this method, you must
   *  call mousemove and mouseup to keep the mixin informed about
   *  what happens in the outside world. You must also define _drop
   *  in the mixed-in class, which is a callback function that is called 
   *  whenever a drop occurs in a rectange. The callback should take
   *  two parameters, draggedId and droppedId.
   * 
   *  @x X coordinate of the mouse on on the document (not screen)
   *  @y Y coordinate of the mouse on on the document (not screen)
   * 
   *  @hitAreas {object} A hash mapping ids to rectangles on the document.
   *  Example: { 
        '123abc': { x1: 121, x2:233, y1:101,  y2: 200 }, 
        '278xka': { x1: 124, x2:727, y1:19,   y2: 59 }
      }
   *
   */
  dragStarted: function(x, y, hitAreas) {
    this._hitAreas = hitAreas;
    this._draggedId = this._idAt(x, y);
    Session.set('dragOriginX', x);
    Session.set('dragOriginY', y);
  },

  /**
   * This needs to be called repeatedly to keep the
   * mixin informed about the outside world.
   */
  mousemove: function(x, y) {
    Session.set('mouseX', x);
    Session.set('mouseY', y);
  },

  /**
   * This needs to be called whenever there is 
   * a mouseup event in the interface, because 
   * the mixin is not aware of the DOM.
   */
  mouseup: function() {
    var dropId = this._getHoveredId();
    if (dropId && this._drop)
      this._drop(this._draggedId, dropId);
    Session.set('dragOriginX', null);
    Session.set('dragOriginY', null);
    this._draggedId = null;
  },

  /**
   * How far (X) from drag origin we have moved.
   */
  dragDeltaY: function(idOrItem) {
    var id = idOrItem._id || idOrItem;
    if (this._draggedId != id) return 0;
    return Session.get('mouseY') - Session.get('dragOriginY');
  },

  /**
   * How far (Y) from drag origin we have moved.
   */
  dragDeltaX: function(idOrItem) { 
    var id = idOrItem._id || idOrItem;
    if (this._draggedId != id) return 0;
    return Session.get('mouseX') - Session.get('dragOriginX');
  },

  /**
   *  Is a given id (or mongo document) 
   *  current being hovered?
   */
  isHovering: function(idOrItem) {
    var id = idOrItem._id || idOrItem;
    return this._getHoveredId() == id;
  },
  
  /**
   *  Are we currently dragging?
   */
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