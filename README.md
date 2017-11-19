# MlDonkeyFox2

Very experimental addon compatible with Firefox 57 to replace "MldonkeyFox protocols Handler"

For what I have found, there is no way for a webextension to register a protocol like "magnet:" or "ed2k:" as it was possible with the legacy extensions API.

This addon check for every links in a page for these types of URLs, and attach a click event handler.
It also check the mie-type and links of downloading page to redirect the request.

