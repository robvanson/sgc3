/*
 *	Wordlists added here will be automatically added to the global list 
 */
 
var wordlists_plus = [
// Add your wordlists here like "New Wordlist"
//	[
//		"New Wordlist", 
//		[["ni3hao3","nǐhǎo","你好","hello!","1","wordlists/Test1/bi4.wav"],["qing3wen4","qǐngwèn","请问","May I ask..?","1","-"]]
//	] 
	[
		"Test1",
		[
		["you3yi4dian3nan2", "you3yi4dian3nan2", "有一点难", "a little difficult","-","-"],
		["tai4nan2le0", "tai4nan2le0", "太难了", "too hard/difficult","-","-"],
		["ping2chang2", "ping2chang2", "平常", "usually","-","wordlists/Test1/bi4.wav"],
		["zao3", "zao3", "早", "early","-","wordlists/Test1/bi4.wav"],
		["zhe4me0", "zhe4me0", "这么", "such, so","-","wordlists/Test1/bian1.wav"],
		["zhe4me0zao3", "zhe4me0zao3", "这么早", "this early, so early","-","-"],
		["wan3", "wan3", "晚", "late","-","wordlists/Test1/bian1.wav"],
		["zhe4mewan3", "zhe4mewan3", "这么晚", "this late, so late","-","wordlists/Test1/bian1.wav"],
		["zao3shang0", "zao3shang0", "早上", "(early) morning (usually before 8-9am)","-","wordlists/Test1/bian1.wav"],
		["gong1ke4", "gong1ke4", "功课", "homework","-","wordlists/Test1/bi4.wav"],
		["zuo4gong1ke4", "zuo4gong1ke4", "做功课", "to do homework","-","-"]
		]
	]
]
	

global_wordlists = wordlists_plus.concat(global_wordlists);

/*
 * 
 * Read wordlists from the wordlists/ subdirectory at the origin
 * 
 */

// Read all wordlists stored in the wordlists subdirectory

function readAllRemoteWordlists (url) {
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

