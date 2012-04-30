BasePresenter = function() {

}

BasePresenter.prototype = {
	_getCurrentPlaylist: function() {
		var simpleName 	= Session.get('currentPlayListSimpleName'),
			selector 	= { name_simple: simpleName };
		return Playlists.findOne(selector);
	}
}