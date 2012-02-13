// Author: gmertk
// 8tracksharkify - An unofficial 8tracks Chrome extension
// It adds Grooveshark and Spotify links of tracks
// Last edit: 13.02.2012

var fixName = function(name) {
    name = name.toLowerCase();
    name = name.replace(/[&']/g, "");
    name = name.replace(/( {2})( )*/g, " ");
    if (name.charAt(name.length - 1) == " ") {
        name = name.substr(0, name.length - 1);
    }
    
	return name;
};

var fixTrackName = function(track_name) {
	track_name = track_name.toLowerCase();
	track_name = track_name.replace (/[&']/g, "");
	track_name = track_name.replace(/(  )( )*/g, " ");
	if(track_name.charAt(track_name.length-1) == " "){
		track_name = track_name.substr(0,track_name.length-1);
	}
	
	
	track_name = track_name.replace(/[)(]/g,"");
	/*
	//truncate parentheses
	var lp_location = track_name.indexOf("(");
	if( lp_location > 0) {
		track_name = track_name.substr(0, lp_location);
	}
	*/
		
	return track_name;
};

var fixArtistName = function(artist_name){
	artist_name = artist_name.toLowerCase();
	artist_name = artist_name.replace (/[&']/g, "");
	artist_name = artist_name.replace(/(  )( )*/g, " ");
	if(artist_name.charAt(artist_name.length-1) == " "){
		artist_name = artist_name.substr(0,artist_name.length-1);
	}
	return artist_name;
};

var request = function(track_obj, callback, url) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = (function(myxhr, track_obj) {
        return function() {
            callback(myxhr, track_obj);
        };
    })(xhr, track_obj);
    
	xhr.open('GET', url, true);
    xhr.send('');
};

var callback_spotify = function(o, track_obj){
    if(o.readyState < 4){
        return;
    }
    if(o.status != 200){
        //console.log("Error");
        return;
    }
    
    var tracksFound = o.responseXML.getElementsByTagName("track"),
    	track_name = track_obj.track,
		artist_name = track_obj.artist,
		favId = track_obj.id;

	if (tracksFound.length !== 0) {
		var track_name_spotify,
			artist_name_spotify,
			track_result = "";
		
		for(var i = 0; i < tracksFound.length; i++){
			track_name_spotify = tracksFound[i].firstElementChild.firstChild.nodeValue,
			artist_name_spotify = tracksFound[i].firstElementChild.nextElementSibling.firstElementChild.firstChild.nodeValue;			
			if ( (track_name_spotify.toLowerCase().indexOf(track_name) > -1) &&
				 (artist_name_spotify.toLowerCase().indexOf(artist_name) > -1)) {
				 track_result = tracksFound[i];
				 break;
			}
		}
		if(track_result == ""){	
			track_result = tracksFound[0];
			
		}
		
		var link = document.createElement("a"),
            linkpic = document.createElement("img"),
            imgURL = chrome.extension.getURL("images/spotify.png"),
			uri = track_result.attributes[0].nodeValue;			
			
		link.setAttribute("href",uri); 
		link.setAttribute("class", "8tracksharkify");
		linkpic.setAttribute("src",imgURL); 
		link.appendChild(linkpic);		
       	
        $('#' + favId).parent().find('.amazon').append(link);
	}
	else{
		console.log("Track not found in Spotify");
	}	
};
	
var callback_grooveshark = function(o, track_obj) {
    if (o.readyState < 4) {
        return;
    }
    if (o.status != 200) {
        //console.log("Error");
        return;
    }
	
    var response = o.responseText,
        track_name = track_obj.track,
		artist_name = track_obj.artist,
		favId = track_obj.id;

    if (response.indexOf("tinysong") > -1) {
        var link = document.createElement("a"),
            linkpic = document.createElement("img"),
            imgURL = chrome.extension.getURL("images/grooveshark.png");

        response = response.replace(/\\/g, "");
        response = response.replace(/(\")/g, "");

        link.setAttribute("href", response);
        link.setAttribute("class", "8tracksharkify");
        linkpic.setAttribute("src", imgURL);
        link.appendChild(linkpic);
       	
        $('#' + favId).parent().find('.amazon').append(link);

    }
	else{
		console.log("Track not found in Grooveshark");
	}
};

var add_links_by_fav_id = function(favId){
	
	var track_name =  $("#" + favId).next('.title_artist').children('.t').text(),
		artist_name = $("#" + favId).next('.title_artist').children('.a').text(),	
		grooveshark_url = "http://tinysong.com/a/%s?format=json&key=cc45fa0c110f65fd76fbf1081f77e80d",
		spotify_url = "http://ws.spotify.com/search/1/track?q=",
		grooveshark_query,
		spotify_query;
		

	track_name = fixTrackName(track_name);
	artist_name = fixArtistName(artist_name);	
	
	grooveshark_query = track_name + " " + artist_name; 
	grooveshark_query = grooveshark_query.split(" ").join("+");	//replace each space by + sign
	
	spotify_query = track_name.split(" ").join("+");

	grooveshark_url = grooveshark_url.replace("%s", grooveshark_query);
	spotify_url += spotify_query;

	var track_obj = {
		track: track_name,
		artist: artist_name,
		id : favId
	};

	request(track_obj,
		function(o,track_obj){
				callback_grooveshark(o,track_obj);
		},
		grooveshark_url
	);
	request(track_obj,
		function(o,track_obj){
				callback_spotify(o,track_obj);
		},
		spotify_url
	);
};

$(document).ready(function(){

	var tracks_played_container = $('ul#tracks_played');
	
	if(tracks_played_container != ""){		
	    var tracks_li = tracks_played_container.children('li.track'),
		 	prev_track_fav_id = tracks_li.first().children().first().attr('id');
	    
	    tracks_li.each(function() {
	        var favId = $(this).children().first().attr('id');
			add_links_by_fav_id(favId);
		});
		
	 	$(tracks_played_container).on("DOMSubtreeModified", function(){
			var lis = tracks_played_container.children('li.track').first();
			var last_track_fav_id = lis.first().children().first().attr('id');
			if(last_track_fav_id != prev_track_fav_id){
				add_links_by_fav_id(last_track_fav_id);
				prev_track_fav_id = last_track_fav_id;
			}
	 	});
	}

});

