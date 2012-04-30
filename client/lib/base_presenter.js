// Base class for the presenters.
// Kind of overkill, and is mostly just to play
// around with inheritance, for kicks, and to prevent the
// _getCurrentPlaylist function from just lying around somewhere.

BasePresenter = function() { }

BasePresenter.prototype = {
	_getCurrentPlaylist: function() {
		var simpleName 	= Session.get('currentPlayListSimpleName'),
			selector 	= { name_simple: simpleName };
		return Playlists.findOne(selector);
	}
}