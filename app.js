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

		startPollingForUpdates();

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

//polling updates
function startPollingForUpdates() {
	var pollingInterval = setInterval(() => {
		console.log('start polling');

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
	}, 300000);
};

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