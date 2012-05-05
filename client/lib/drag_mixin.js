/*
 * Mixin that helps implement drag-n-drop sorting
 * in reactive presenters. This is pretty generalized
 * and not tied to PowerPinkPlay, and can be used
 * for future senarios with very little work.
 * 
 * TODO: Change naming to reduce chance for conflicts
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
   *  @spacing The amount of space the placholder takes up, including margin.
   *
   */
  dragStarted: function(x, y, hitAreas, spacing) {
    this._hitAreas = hitAreas;
    this._spacing = spacing || 0;

    // NOTE: We are using the Meteor Session object to store these 
    // values. The ONLY reason we do this is to get these values to be
    // reactive (http://docs.meteor.com/#reactivity). With more time, I'd 
    // definitely give this mixin it's own reactive context instead 
    // of piggybacking on the Session.
    Session.set('__dragId', this._idAt(x, y));
    Session.set('__dragOriginX', x);
    Session.set('__dragOriginY', y);
  },

  /**
   * This needs to be called repeatedly to keep the
   * mixin informed about the outside world (as presenters are not
   * aware of the DOM.
   */
  mousemove: function(x, y) {
    Session.set('__mouseX', x);
    Session.set('__mouseY', y);
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
        this._drop(Session.get('__dragId'), dropBelowId);
      } else {
        var dropOnTopOfId = this._getHoveringOnTopOfId();
        if (dropOnTopOfId) 
          this._drop(Session.get('__dragId'), dropOnTopOfId);
      }

    }
    
    Session.set('__dragOriginX', null);
    Session.set('__dragOriginY', null);
    Session.set('__dragId', null)
  },

  /**
   * How far (X) from drag origin we have moved.
   */
  dragDeltaY: function(idOrItem) {
    var id = idOrItem._id || idOrItem;
    if (Session.get('__dragId') != id) return 0;
    return Session.get('__mouseY') - Session.get('__dragOriginY');
  },

  /**
   * How far (Y) from drag origin we have moved.
   */
  dragDeltaX: function(idOrItem) { 
    var id = idOrItem._id || idOrItem;
    if (Session.get('__dragId') != id) return 0;
    return Session.get('__mouseX') - Session.get('__dragOriginX');
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
    return !!Session.get('__dragOriginX');
  },

  /** 
   * Is the given item currently being dragged?
   */
  isDraggingItem: function(idOrItem) {
    var id = idOrItem._id || idOrItem;
    return id == Session.get('__dragId');
  },

  // Returns the id (if any) of the rectangle that the mouse cursor
  // is currently positioned on top of.
  _getHoveringOnTopOfId: function() {
    if (!this.isDragging()) return null;
    var id = this._idAt(Session.get('__mouseX'), Session.get('__mouseY'));
    if (id == Session.get('__dragId')) return null;
    return id;
  },

  // Returns the id (if any) of the rectangle that the dragged rectangle 
  // is currently positioned below. 
  _getHoveringBelowId: function(spacing) {
    var dragRect = this._getDragRectangle();
    if(!dragRect) return;

    var mx = Session.get('__mouseX'), 
        my = Session.get('__mouseY');

    for (var id in this._hitAreas) {
      var ha = this._hitAreas[id];
      // Is the drag rectangle below this hit area?
      if ( Session.get('__dragId') != id && // cannot hover self
          dragRect.y2 > ha.y2 &&
          dragRect.y1 < ha.y2 + this._spacing &&
          id != this._getClosestAboveId(Session.get('__dragId'))) return id;
    }
    return null;
  },

  // Returns the id of the rectangle immideately above 
  // the rectangle with the given id.
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

  // Returns the rectangle that is currently 
  // being dragged, if any.
  _getDragRectangle: function() {
    if (!this.isDragging()) return null;
    var id = Session.get('__dragId'),
        rect = this._hitAreas[id],
        deltaX = this.dragDeltaX(id),
        deltaY = this.dragDeltaY(id)

    return {
        x1: rect.x1 + deltaX, x2: rect.x2 + deltaX,
        y1: rect.y1 + deltaY, y2: rect.y2 + deltaY
    }
  },

  // Returns the hitarea at given coordinates.
  _idAt: function(x, y) {
    for (var id in this._hitAreas) {
      var r = this._hitAreas[id];
      if(y > r.y1 && y < r.y2 && x > r.x1 && x < r.x2)
        return id;
    }
    return null;
  }

}