var config = null;

// Get the webextension configuration from the background script
function getConfig() {
	return new Promise( (resolve, reject) => {
		let message = browser.runtime.sendMessage({type: "get_config"});
		message.then( (message) => {
			config = message.config;
			if ( config )
				resolve();
			else
				reject();
		} );
	} );
}

// get new config
browser.runtime.onMessage.addListener( (message) => {
	switch ( message.type ) {
		case "new_config":
			config = message.config;
			findLinks(document);
			break;
		case "display":
			displayMessage(message);
			break;
		default:
			console.log("MlDonkeyFox2: incorrect message type received in content script" + message.type);
			break;
	}
	
});

// Display messages
// create a fixed div, populated with the messages.
function displayMessage(message) {
	let container = document.getElementById("mldonkeyfox2_messages_area");
	
	// create the main dic if needed
	if ( !container ) {
		container = document.createElement("div");
		container.id = "mldonkeyfox2_messages_area";
		document.getElementsByTagName("body")[0].appendChild(container);
	}
	
	// Create the message
	let item = document.createElement("div");
	
	item.classList.add("mldonkeyfox2_" + message.level);

	window.setTimeout( () => { item.classList.add("mldonkey2_show"); }, 10);
	
	if ( message.title ) {
		let title = document.createElement("p");
		title.className += "mldonkey2_title";
		title.textContent = message.title;
		item.appendChild(title)
	}
	if ( message.url ) {
		let url = document.createElement("p");
		url.className += "mldonkey2_url";
		url.textContent = message.url;
		item.appendChild(url)
	}
	if ( message.bottom ) {
		let bottom = document.createElement("p");
		bottom.className += "mldonkey2_bottom";
		bottom.textContent = message.bottom;
		item.appendChild(bottom)
	}
	if ( message.action ) {
		switch (message.action) {
			case "force_download":
				clearForceDownloadActionButton();
				let actionButton = document.createElement("button");
				actionButton.id = "mldonkeyfox2_force_download_action_button";
				actionButton.className += "mldonkeyfox2_action_button";
				actionButton.textContent = message.label;
				actionButton.addEventListener("click", forceDownload, true);
				actionButton.value =  JSON.stringify(message);
				item.appendChild(actionButton);
				break;
			case "submitted":
				clearForceDownloadActionButton();
				break;
		}
	}
	
	container.appendChild(item);
	
	// delete the message after a timeout
	window.setTimeout( () => {
		item.classList.remove("mldonkey2_show");
		window.setTimeout( () => {
			container.removeChild(item);
		}, 500);
	}, 5000);
}

function clearForceDownloadActionButton() {
	let button = document.getElementById("mldonkeyfox2_force_download_action_button");
	if ( button )
		button.outerHTML = "";
}

// link all links click events to a callback
function findLinks(elem) {
	for ( let target of elem.querySelectorAll("a") ) {
		if ( target.href.substring(0,7) == "ed2k://" )
			if ( config.ed2k )
				target.addEventListener("click", linkClicked, true);
			else
				target.removeEventListener("click", linkClicked);
		else if ( target.href.substring(0,7) == "magnet:" )
			if ( config.magnet )
				target.addEventListener("click", linkClicked, true);
			else
				target.removeEventListener("click", linkClicked);

	}
	for (let target of elem.querySelectorAll("input[type=checkbox]")) {
        if ( target.value.substring(0,7) == "ed2k://" )
            if ( config.ed2k ) {
                target.href = target.value;
                target.addEventListener("click", linkClicked, true);
            }
            else
                target.removeEventListener("click", linkClicked);
        else if ( target.value.substring(0,7) == "magnet:" )
            if ( config.magnet ) {
                target.href = target.value;
                target.addEventListener("click", linkClicked, true);
            }
            else
                target.removeEventListener("click", linkClicked);


	}
}

// link click callback
function linkClicked(e) {
	e.preventDefault();
	e.stopPropagation();
	e.stopImmediatePropagation()
	browser.runtime.sendMessage({type: "submit", uri: e.currentTarget.href, description: e.currentTarget.textContent}).then( (response) => {
		if ( response )
			displayMessage(response);
	});
	return false;
}

function forceDownload(e) {
	e.preventDefault();
	e.stopPropagation();
	e.stopImmediatePropagation()
	let message = JSON.parse(e.currentTarget.value);
	browser.runtime.sendMessage({type: "force_dl", url: message.url}).then( (response) => {
		if ( response )
			displayMessage(response);
	});
	return false;
}

getConfig().then( () => {
	findLinks(document);
} );
