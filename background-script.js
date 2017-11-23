var config = null;

// receive messages from the content script
function getMessage(message, sender, senderResponse) {
	switch (message.type) {
		case "reload_config":
			reloadConfig(message.config);
			break;
		case "get_config":
			getConfig().then( () => { senderResponse({config: config}) } );
			return true;  // tells the answer will come asynchronously
			break;
		case "submit":
			submitURI(message).then( (response) => { senderResponse(response); });
			return true;
			break;
		case "force_dl":
//TODO: propose to force download when already downloaded
			break;
		default:
			console.log("MlDonkeyFox2: incorrect message type received in background script" + message.type);
			break;
	}
}

// Get the webextension configuration
function getConfig() {
	return new Promise( (resolve, reject) => {
		if ( config )
			resolve(config);
		else {
			let myStorage = browser.storage.local;
				
			myStorage.get('MlDonkeyFox').then( (items) => {
				if (items.MlDonkeyFox) {
					config = items.MlDonkeyFox;
					if ( config )
						resolve(config);
					else
						reject();
				}
			});
		}
	});
}

// signal a new config is available
function reloadConfig(newConfig) {
	config = newConfig;
	registerBittorrentContent();
	browser.tabs.query( {} ).then( (tabs) => {
		for ( let tab of tabs ) {
			browser.tabs.sendMessage( tab.id, { type: "new_config", config: config } );
		}
	});
}

// submit the link to mldonkey
function submitURI(target) {
	return new Promise( (resolve, reject) => {
		if ( !config.url ) {
			resolve({title: "Please, first configure the MlDonkeyFox addon", level: "error"});
		}
		
		let uri = target.uri;
		let description = target.description;
		if ( description == "" )
			description = uri;
		
		let mldonkeyUrl;
		
		if ( config.user == "" )
			mldonkeyUrl = config.protocol + "://" + config.url + ":" + config.port.toString();
		else
			mldonkeyUrl = config.protocol + "://" + config.user + ":" + config.password + "@" + config.url + ":" + config.port.toString();
		
		let fullUrl = mldonkeyUrl + "/submit?q=";
		if ( target.type == "torrent_header" )
			fullUrl += "startbt+";
		else
			fullUrl += "dllink+";
		fullUrl += encodeURIComponent(uri);

		let request = new XMLHttpRequest();
		
		request.open("GET", fullUrl, true);
		
		request.onreadystatechange = function() {
			if ( request.readyState == 4 ) {
				if ( request.status == 200 ) {
					let resp = request.responseText;
					if ( resp.search("File is already in download queue") != -1 ) {
						resolve({title: "File already downloading:", url: description, level: "warning"});
					}
					else if ( resp.search("File already downloaded") != -1 ) {
						resolve({title: "File has already been downloaded:", url: description, level: "warning"});
					}
					else if ( resp.search("Unable to match URL") != -1 ) {
						resolve({title: "Internal error: Unable to match URL:", url: description, level: "error"});
					}
					else {
						resolve({title: "File submitted:", url: description, level:"info"});
					}
				}
				else if ( request.status != 0 ) {
					resolve({title: "Error while submitting", url: description, bottom: "http status: " + request.statusText, level: "error"});
				}
			}
		};
		
		request.onerror = function (e) {
			resolve({title: "Error while submitting", url: description, bottom: "error, cannot reach server: " + mldonkeyUrl, level: "error"});
		};
		
		request.send(null);
	});
}

function getHeaders(event) {
	// redirect
	if ( event.statusCode >= 300 && event.statusCode <= 399 ) {
		let uri = null;
		let location = findHeader(event.responseHeaders, "location");
		if ( location.substring(0,7) == "ed2k://" ) {
			if ( config.ed2k )
				uri = location;
		}
		else {
			if ( location.substring(0,7) == "magnet:" ) {
				if ( config.magnet )
					uri = location;
			}
		}

		if ( uri ) {
			submitURI( {type: "submit", uri: uri, description: uri} ).then( (response) => {
				response.type = "display";
				browser.tabs.sendMessage(event.tabId, response);
			} );
			return { redirectUrl: "about:blank" };
		}
	}
	// check for torrent file type
	else {
		if ( config.bittorrent ) {
			if ( findHeader(event.responseHeaders, "content-type") == "application/x-bittorrent" ) {
				submitURI( {type: "torrent_header", uri: event.url, description: event.url} ).then( (response) => {
					response.type = "display";
					browser.tabs.sendMessage(event.tabId, response);
				} );
				return { redirectUrl: "about:blank" };
			}
		}
	}
}

function checkRequest(event) {
	
}

function findHeader(headers, name) {
	for ( let header of headers ) {
		if ( header.name.toLowerCase() == name.toLowerCase() )
			return header.value;
	}
	return null;
}

function registerWebrequests() {
	browser.webRequest.onHeadersReceived.removeListener(getHeaders)
	browser.webRequest.onHeadersReceived.addListener(getHeaders, {urls: ["http://*/*", "https://*/*"], types: ["main_frame", "sub_frame"]}, ["blocking", "responseHeaders"]);
}

getConfig().then( () => { registerWebrequests(); } );
browser.runtime.onMessage.addListener(getMessage);

