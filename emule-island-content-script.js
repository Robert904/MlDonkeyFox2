
var launchdl = document.querySelector("#launchdl");
if(launchdl) {
	// replace existing submit button to clear default click handler
	// add new button with handler to submit download to background
	var launchdl2 = launchdl.cloneNode(true);
	launchdl.parentElement.insertBefore(launchdl2,launchdl);
	launchdl.remove();
	launchdl2.addEventListener("click",(clicked)=>{
		var links = [];
		document.querySelectorAll("#alllinks>.link>.cb>input").forEach((cbInput)=>{
			if(cbInput.checked)
				links.push(cbInput.value);
		});
		links.map((link)=>{
			browser.runtime.sendMessage({
				type: "submit", 
				uri: link, 
				description: "Link from emule-island.ru"
			});
		});
	});
}
