// Saves to sync
var myStorage = browser.storage.local;

var submitButton = document.querySelector('button.submit');
var protocol = document.querySelector('[id="protocol"]');
var url = document.querySelector('[id="url"]');
var port = document.querySelector('[id="port"]');
var user = document.querySelector('[id="user"]');
var password = document.querySelector('[id="password"]');
var ed2k = document.querySelector('[id="ed2k"]');
var magnet = document.querySelector('[id="magnet"]');
var bittorrent = document.querySelector('[id="bittorrent"]');

// Load any URL Configuration that may have previously been saved.
loadChanges();

submitButton.addEventListener('click', saveChanges);

// Saves URL
function saveChanges() {
	var config = new Object();
	// Get a values saved in a form.
	config.protocol = protocol.value;
	config.url = url.value;
	config.port = port.value;
	config.user = user.value;
	config.password = password.value;
	config.ed2k = ed2k.checked;
	config.magnet = magnet.checked;
	config.bittorrent = bittorrent.checked;
	
  	// Check that there's some code there.
  	if (!config.url || !config.port) {
  		message('Error: You must specify MLDonkey URL and Port');
  		return;
  	}
  	if (config.port!=parseInt(port.value, 10)) {
  		message('Error: The MLDonkey port must be an integer');
  		return;
  	}
  	if (config.port<1 || config.port>65535) {
  		message('Error: The MLDonkey port must be between 1 and 65535');
  		return;
  	}
  	// Save it using the Chrome extension storage API.
  	myStorage.set({'MlDonkeyFox': config});
	
	// signal the new configuration to the background script
	browser.runtime.sendMessage( {type: "reload_config", config: config} );
}

function loadChanges() {
	myStorage.get('MlDonkeyFox').then(function(items) {
		if (items.MlDonkeyFox) {
			protocol.value = items.MlDonkeyFox.protocol;
			url.value = items.MlDonkeyFox.url;
			port.value = items.MlDonkeyFox.port;
			if ( items.MlDonkeyFox.user )
				user.value = items.MlDonkeyFox.user;
			else
				user.value = "";
			if ( items.MlDonkeyFox.password )
				password.value = items.MlDonkeyFox.password;
			else
				password.value = "";
			}
			ed2k.checked = items.MlDonkeyFox.ed2k;
			magnet.checked = items.MlDonkeyFox.magnet;
			bittorrent.checked = items.MlDonkeyFox.bittorrent;
		});
}

function message(msg) {
	var message = document.querySelector('.message');
	message.innerText = msg;
	setTimeout(function() {
		message.innerText = '';
	}, 3000);
}