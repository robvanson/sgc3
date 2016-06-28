/*
 *	Wordlists added here will be automatically added to the global list 
 */
 
var wordlists_plus = [
// Add your wordlists here like "New Wordlist"
//	[
//		"New Wordlist", 
//		[["ni3hao3","nǐhǎo","你好","hello!","1","wordlists/Test1/bi4.wav"],["qing3wen4","qǐngwèn","请问","May I ask..?","1","-"]]
//	] 
]

global_wordlists = wordlists_plus.concat(global_wordlists);

/*
 * 
 * Read wordlists from the wordlists/ subdirectory at the origin
 * 
 */

// Read all wordlists stored in the wordlists subdirectory

function readAllRemoteWordlists (url) {
	if(!navigator.onLine)return null; // Only when Online
	var rawFile = new XMLHttpRequest(); 
	rawFile.overrideMimeType("text/plain");
	rawFile.open("GET", url, true);
	rawFile.onreadystatechange = function () {
		if(rawFile.readyState === 4) {
			if(rawFile.status === 200 || rawFile.status == 0) {
				var allText = rawFile.responseText;
				var wordlistFiles = allText.match(/wordlists\/[^\"\']+/g);
				if (wordlistFiles) {
					for (var u = 0; u < wordlistFiles.length; ++u) {
						var url = wordlistFiles [u];
						if (url.match(/\.(Table|tsv|csv)$/)) {
							readWordlist (url);
						} else if (!url.match(/\.[^\.]+$/)) {
							readAllRemoteWordlists (url);
						};
					};
				};
			}
		}
	}
	rawFile.send(null);
};

