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
  dragStarted: function(x, y, hitAreas, spacing) {
    this._hitAreas = hitAreas;
    var id = this._idAt(x, y);
    this._spacing = spacing || 0;
    Session.set('dragKey', id);
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
    if (this._drop) {
      var dropBelowId = this._getHoveringBelowId();
      if (dropBelowId) {
        this._drop(Session.get('dragKey'), dropBelowId);
      } else {
        var dropOnTopOfId = this._getHoveringOnTopOfId();
        if (dropOnTopOfId) 
          this._drop(Session.get('dragKey'), dropOnTopOfId);
      }

    }
    
    Session.set('dragOriginX', null);
    Session.set('dragOriginY', null);
    Session.set('dragKey', null)
  },

  /**
   * How far (X) from drag origin we have moved.
   */
  dragDeltaY: function(idOrItem) {
    var id = idOrItem._id || idOrItem;
    if (Session.get('dragKey') != id) return 0;
    return Session.get('mouseY') - Session.get('dragOriginY');
  },

  /**
   * How far (Y) from drag origin we have moved.
   */
  dragDeltaX: function(idOrItem) { 
    var id = idOrItem._id || idOrItem;
    if (Session.get('dragKey') != id) return 0;
    return Session.get('mouseX') - Session.get('dragOriginX');
  },

  /**
   *  Is a given id (or mongo document) 
   *  current being hovered?
   */
  isHoveringBelow: function(idOrItem) {
    var id = idOrItem._id || idOrItem;
    if (!this.isDragging())     return false;
    var hoveredId = this._getHoveringBelowId();
    return hoveredId == id;
  },
  
  /**
   *  Are we currently dragging?
   */
  isDragging: function() {
    return !!Session.get('dragOriginX');
  },

  isDraggingItem: function(idOrItem) {
    var id = idOrItem._id || idOrItem;
    return id == Session.get('dragKey');
  },

  _getHoveringOnTopOfId: function() {
    if (!this.isDragging()) return null;
    var id = this._idAt(Session.get('mouseX'), Session.get('mouseY'));
    if (id == Session.get('dragKey')) return null;
    return id;
  },

  _getHoveringBelowId: function(spacing) {
    var dragRect = this._getDragRectangle();
    if(!dragRect) return;

    var mx = Session.get('mouseX'), 
        my = Session.get('mouseY');

    for (var id in this._hitAreas) {
      var ha = this._hitAreas[id];
      // Is the drag rectangle below this hit area?
      if ( Session.get('dragKey') != id && // cannot hover self
          dragRect.y2 > ha.y2 &&
          dragRect.y1 < ha.y2 + this._spacing &&
          id != this._getClosestAboveId(Session.get('dragKey'))) return id;
    }
    return null;
  },

  _getClosestAboveId: function(belowId) {
    var rectBelow = this._hitAreas[belowId],
        closestAboveRect = null,
        closestAboveId = null;

    for (var id in this._hitAreas) {
      var rect = this._hitAreas[id];
      if (rect.y2 < rectBelow.y1) {
        if (!closestAboveRect || rect.y1 > closestAboveRect.y1) {
          closestAboveRect = rect;
          closestAboveId = id;
        }
      } 
    }

    return closestAboveId;
  },

  _getDragRectangle: function() {
    if (!this.isDragging()) return null;
    var id = Session.get('dragKey'),
        rect = this._hitAreas[id],
        deltaX = this.dragDeltaX(id),
        deltaY = this.dragDeltaY(id)

    return {
        x1: rect.x1 + deltaX, x2: rect.x2 + deltaX,
        y1: rect.y1 + deltaY, y2: rect.y2 + deltaY
    }
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