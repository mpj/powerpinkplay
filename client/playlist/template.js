(function() {
  
  var presenter = new PlaylistPresenter(player, spotifyTrackSearch);

  Template.playlist.isVisible = 
    function() { return presenter.isVisible() }
  
  Template.playlist.headerText = 
    function() { return presenter.headerText() }



  Template.playlistItems.items = 
    function() { return presenter.items() }

  Template.playlistItems.isTrashVisible = 
    function() { return presenter.isDragging() }



  Template.playlistItem.playPauseIconClass =
    function() { return presenter.playPauseIconClass(this) }

  Template.playlistItem.needlePosition = function() { 
    var progress = presenter.needleProgress(this),
        scrubberWidth = $('.playlistItem .container').width();
    return Math.floor(scrubberWidth * progress);
  }

  Template.playlistItem.isPlaceholderVisible = function() { 
    return presenter.isHoveringBelow(this) 
  }

  Template.playlistItem.offsetX = 
    function() { return presenter.dragDeltaX(this) }

  Template.playlistItem.offsetY = 
    function() { return presenter.dragDeltaY(this) }

  Template.playlistItem.isDragged = 
    function() { return presenter.isDraggingItem(this) }

  Template.playlistItem.events = {
    
    'click .playPauseIcon .clickArea': function(e) {
      e.preventDefault();
      presenter.playPauseIconClicked(this);
    },

    'click .container .clickArea': function(e) {
      e.preventDefault();

      // Find out the relative position the container was 
      // clicked. Clicking near the start would be 0.01 and
      // clicking near the end would be 0.99.
      var $container = $(e.target).parents('.container'),
          offsetLeft = $container.offset().left,
          relativeX = e.clientX - offsetLeft,
          progress = relativeX / $container.width();
      presenter.containerClicked(this, progress);
    },

    'mousedown .moveIcon .clickArea': function(e) {
      e.preventDefault();

      // Construct hit area rectangles 
      // for all playlistitems and the trash.
     
      var getRectangle = function(element) {
        // Get the rectangle of a html element,
        // absolutely positioned on the document.
        var left = $(element).position().left,
            top = $(element).position().top,
            width = $(element).width(),
            height = $(element).height();
        return { x1: left, y1: top, x2: left + width, y2: top + height };
      }

      var hitAreas = {};
      $(".playlistItem").each(function() {
        hitAreas[this.id] = getRectangle(this);
      });
      hitAreas['trash'] = getRectangle($('#trash'));

      var spacing = $("#playlist .placeholder").outerHeight(true);
      presenter.dragStarted(e.pageX, e.pageY, hitAreas, spacing);
    }

  }



  Template.addPlaylistItem.typeAheadResults = 
    function() { return presenter.typeAheadResults() };
  
  Template.addPlaylistItem.isSelected = 
    function() { return presenter.isTypeAheadSelected(this) }
  
  Template.addPlaylistItem.isLoading = 
    function() { return presenter.isTypeAheadLoading(this) }

  Template.addPlaylistItem.events = {
    
    'focusout input': 
      function(e) { presenter.addPlaylistItemTextInputBlur() },
    
    'focusin input': 
      function(e) { presenter.addPlaylistItemTextInputFocus() },

    'keyup input': function(e) {
      
      switch(e.keyCode) {
        
        case KEY_CODE_ENTER:
          $(e.target).val('').focus(); // TODO: Make this reactive.
          presenter.addPlaylistItemTextInputEnterPressed();
          break;
        
        case KEY_CODE_ARROW_DOWN:
          return presenter.selectNextTypeAhead();

        case KEY_CODE_ARROW_UP:
          return presenter.selectPreviousTypeAhead();

        default:
          return presenter.queryTypeAhead(e.target.value);

      }
        
    }
    
  }


  

  $(document)
    .mouseup(function() { presenter.mouseup() })
    .mousemove(function(e) { presenter.mousemove(e.pageX, e.pageY) });

})();
