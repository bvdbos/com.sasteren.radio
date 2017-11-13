'use strict';

const Homey = require('homey');
const dateformat = require('dateformat');
//var FeedMe = require('feedme');
var http = require('http');
var https = require('https');
var httpmin = require ('http.min');
var data = []; //array with media-objects
var urllist = []; //array with {name,url} feeds from settings
var replText;

class Radio extends Homey.App {
	
	onInit() {
		
		this.log('Homey Radio is running...');
		
		getsettings().then(function(results) {
			console.log("settings start read");
			urllist=results;
			console.log(urllist);
			
			if (urllist === null) {
				console.log('urllist is null');
				urllist = {"name" : 'radionaam',"url": 'http://icecast.omroep.nl/radio1-sb-mp3'};
			};
			
			var result = [{
				type: 'playlist',
				id: 'radiostations',
				title: 'radiostations',
				tracks: parseTracks(urllist)
				}];
			data=result;
			Homey.ManagerMedia.requestPlaylistsUpdate();
		});

		Homey.ManagerMedia.on('getPlaylists', (callback) => {
			console.log('Homey gets playlists');
			console.log(data);
			return callback(null, data);
		});	

		Homey.ManagerMedia.on('getPlaylist', (request, callback) => {
			console.log('Homey gets single playlist');
			return callback(null, data);
		});

		Homey.ManagerMedia.on('play', (objectid, callback) => {
			console.log(objectid);
			var urlobj= { stream_url : objectid.trackId };
			console.log(urlobj);			
			return callback(null, urlobj);
		});
		
		Homey.ManagerSettings.on('set', function(settings) {
			getsettings().then(function(results) {
				console.log("settings update read");
				urllist=results;
				console.log(urllist);
			
				if (urllist === null) {
					console.log('urllist is null');
					urllist = {"name" : 'radionaam',"url": 'http://icecast.omroep.nl/radio1-sb-mp3'};
				};
			
				var result = [{
					type: 'playlist',
					id: 'radiostations',
					title: 'radiostations',
					tracks: parseTracks(urllist)
				}];
			data=result;
			Homey.ManagerMedia.requestPlaylistsUpdate();
			});
		});
		
	}
}

//get name and url list from settings and create array
function getsettings() {
	return new Promise(function(resolve,reject){
		var replText = Homey.ManagerSettings.get('radio');		
		if (replText === null) {
				console.log('settings is null');
				replText = {radio1: 'http://icecast.omroep.nl/radio1-sb-mp3'};
			};
		console.log(replText);
		var list = []
		if (typeof replText === 'object') {
			Object.keys(replText).forEach(function (key) {
				list.push( {"name":key,"url":replText[key]})
				return list;
			});
			
		list.forEach(function(listobject) {
			var objIndex = urllist.findIndex(obj => obj.url == listobject.url);
			console.log ("objIndex ", objIndex, "in urllist voor ",listobject.url);
			if (objIndex > -1) {
				console.log("gegevens overnemen");
				listobject.token = urllist[objIndex].token;
			} else {
				listobject.token = new Homey.FlowToken( listobject.name, {
						type: 'string',
						title: listobject.name
					});
				listobject.token.register()
					.then(() => {
						return listobject.token.setValue( listobject.url );
					})
			}
		});

		if (urllist.length > 0) {
		urllist.forEach(function(listobject) {
			var objIndex = list.findIndex(obj => obj.url == listobject.url);
			console.log("listobject in lijst ", objIndex);
			if (objIndex < 0) {
				//not found so delete
				//console.log("url niet gevonden dus verwijderen");
				listobject.token.unregister()
					.then(() => {
						console.log("token unregistered");
					})
			} else {
				//console.log("url gevonden dus niets doen");
				//wel gevonden dus niets doen
			}
		});
		}		
			
			
			
			
			
			
			
			
		resolve(list);	
		}
	})
};	

function parseTracks(tracks) {
	const result = [];
	if (!tracks) {
		return result;
	}
	tracks.forEach((track) => {
		const parsedTrack = parseTrack(track);
		parsedTrack.confidence = 0.5;
		result.push(parsedTrack);
		//console.log(parsedTrack);
	});
	//console.log(result);
	return result;
}

function parseTrack(track) {
	return {
		type: 'track',
		id: track.url,
		title: track.name,
		artist: [
			{
				"name": "radio",
				"type": "artist",
			},
		],
		album: "stream",
		duration: null,
		artwork: '',
		genre: 'online radiostation',
		release_date: dateformat(Date(), "yyyy-mm-dd"),
		codecs: ['homey:codec:mp3'],
		bpm: 0
	}
}
	

module.exports = Radio;