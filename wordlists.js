/* 
 * SpeakGoodChinese 3
 * Copyright (C) 2016 R.J.J.H. van Son (r.j.j.h.vanson@gmail.com)
 * 
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You can find a copy of the GNU General Public License at
 * http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 */

var currentWordlist = [];
var wordlists = [];
var personalWordlists = [];
var wordlistNumber;
function get_wordlist (wordlistName) {
	var wordlistNum;
	for(wordlistNum = 0; wordlistNum < wordlists.length && wordlists[wordlistNum][0] != wordlistName; wordlistNum++) { };
	// Reset selections
	if (currentWordlist != wordlists[wordlistNum][1] && sgc3_settings) {
		sgc3_settings.selectedLessons = [];
		sgc3_settings.selectedTones = [];
		sgc3_settings.deselectedWords = [];
	};
	currentWordlist = wordlists[wordlistNum][1];
	wordlistNumber = wordlistNum;
};

function wordlistExist (wordlists, wordlistName) {
	var wordlistfound = false;
	for(var wordlistNum = 0; wordlistNum < wordlists.length && ! wordlistfound; wordlistNum++) { 
		if (wordlists[wordlistNum][0] == wordlistName) wordlistfound = true;
	};
	return wordlistfound;
};

function add_wordlist_names_to_select () {
	var selector = document.getElementById('SelectWordList');
	var i = 0;
	// First, remove old entries
	var numOptions = selector.options.length
	for(var i = numOptions - 1; i > 1; --i) {
		selector.remove(i);
	};
	// Add new entries
	for(i=0; i < wordlists.length; ++i) {
		var lastOption = selector.options.length - 1;
		var wordlistTitle = wordlists[i][0];
		var newOption = selector.options[0].cloneNode(true);
		newOption.value = wordlistTitle;
		newOption.text = wordlistTitle;
		selector.add(newOption);
	};
};

function addNewWordlist (oldWordlists, newWordlist) {
	// First, remove doubles
	var wordlistName = newWordlist [0];
	for (var i = 0; i < oldWordlists.length; ++i) {
		if (oldWordlists[i][0] == wordlistName) {
			oldWordlists.splice(i, 1);
		};
	};
	oldWordlists.unshift(newWordlist);
	return oldWordlists;
};

function combineWordlistLists (wordlists1, wordlists2) {
	var combined = wordlists1.slice();
	if (wordlists2) {
		for (var i = 0; i < wordlists2.length; ++i) {
			combined = addNewWordlist(combined, wordlists2[i]);
		 };
	};
	return combined;
};

function itemIsActive (itemNum) {
	var active = true;
	if (sgc3_settings) {
		if (itemNum >= 0 && itemNum < currentWordlist.length) {
			var currentItem = currentWordlist[itemNum];
			// Lesson selected
			if (sgc3_settings.selectedLessons.length > 0) {
				 if(sgc3_settings.selectedLessons.indexOf(currentItem [4]+"") <= -1) active = false;
			 };
			// Tones selected
			if (sgc3_settings.selectedTones.length > 0) {
				 if(! currentItem [0].match(new RegExp("["+sgc3_settings.selectedTones.join("")+"]", 'g'))) active = false;
			 };
			// Deselected words
			if (sgc3_settings.deselectedWords.length > 0) {
				 if(sgc3_settings.deselectedWords.indexOf(currentItem [0]) <= -1) active = false;
			 };
		};
	};

	return active;
};

Array.prototype.shuffle = function() {
	var input = this;
	
	for (var i = input.length-1; i >=0; i--) {
	
		var randomIndex = Math.floor(Math.random()*(i+1)); 
		var itemAtIndex = input[randomIndex]; 
		
		input[randomIndex] = input[i]; 
		input[i] = itemAtIndex;
	}
	return input;
}

/*
 * 
 * Read wordlists from tsv or csv files
 * 
 */
 
function numbersToTonemarks (pinyin) {
	// Add '-quote between vowels
	var intermediatePinyin = pinyin.replace(/([aeuiov])([0-9])([aeuiov])/g, "$1$2'$3");
	// Move numbers to the nucleus vowel
	// To the vowel
	intermediatePinyin = intermediatePinyin.replace(/([aeuiov])([^aeuiov0-9]*)([0-9])/g, "$1$3$2");
	// Either a/e
	intermediatePinyin = intermediatePinyin.replace(/([ae])([aeuiov]*)([0-9])/g, "$1$3$2")
	// Or the Oo in /ou/
	intermediatePinyin = intermediatePinyin.replace(/(ou)([0-9])/g, "o$2u");
	// or the second vowel
	intermediatePinyin = intermediatePinyin.replace(/([uiov][aeuiov])([uiov])([0-9])/g, "$1$3$2");
	// Convert all tones to special characters
	// Tone 1
	intermediatePinyin = intermediatePinyin.replace(/a1/g, "ā");
	intermediatePinyin = intermediatePinyin.replace(/e1/g, "ē");
	intermediatePinyin = intermediatePinyin.replace(/u1/g, "ū");
	intermediatePinyin = intermediatePinyin.replace(/i1/g, "ī");
	intermediatePinyin = intermediatePinyin.replace(/o1/g, "ō");
	intermediatePinyin = intermediatePinyin.replace(/ü1/g, "ǖ");
	//intermediatePinyin = intermediatePinyin.replace(/1/g, "\\-^");
	
	// Tone 2
	intermediatePinyin = intermediatePinyin.replace(/a2/g, "á");
	intermediatePinyin = intermediatePinyin.replace(/e2/g, "é");
	intermediatePinyin = intermediatePinyin.replace(/u2/g, "ú");
	intermediatePinyin = intermediatePinyin.replace(/i2/g, "í");
	intermediatePinyin = intermediatePinyin.replace(/o2/g, "ó");
	intermediatePinyin = intermediatePinyin.replace(/ü2/g, "ǘ");
	intermediatePinyin = intermediatePinyin.replace(/([iaeou])2/g, "$1'");
	
	// Tone 3
	intermediatePinyin = intermediatePinyin.replace(/a3/g, "ǎ");
	intermediatePinyin = intermediatePinyin.replace(/e3/g, "ě");
	intermediatePinyin = intermediatePinyin.replace(/u3/g, "ǔ");
	intermediatePinyin = intermediatePinyin.replace(/i3/g, "ǐ");
	intermediatePinyin = intermediatePinyin.replace(/o3/g, "ǒ");
	intermediatePinyin = intermediatePinyin.replace(/ü3/g, "ǚ");

	// Tone 4
	intermediatePinyin = intermediatePinyin.replace(/a4/g, "à");
	intermediatePinyin = intermediatePinyin.replace(/e4/g, "è");
	intermediatePinyin = intermediatePinyin.replace(/u4/g, "ù");
	intermediatePinyin = intermediatePinyin.replace(/i4/g, "ì");
	intermediatePinyin = intermediatePinyin.replace(/o4/g, "ò");
	intermediatePinyin = intermediatePinyin.replace(/ü4/g, "ǜ");
	intermediatePinyin = intermediatePinyin.replace(/([iaeou])4/g, "$1`");
	
	// Tone 0
	// Remove tone 0 symbol completely
	intermediatePinyin = intermediatePinyin.replace(/[06]/g, "");

	return intermediatePinyin;
};

// Convert unicode Pinyin into tone numbers
function tonemarksToNumbers (pinyin) {
	intermediatePinyin = pinyin;
	// Convert all special characters to numbers
	// Tone 1
	intermediatePinyin = intermediatePinyin.replace(/(ā)([iaeouü]*)/ig, "a$21");
	intermediatePinyin = intermediatePinyin.replace(/(ē)([iaeouü]*)/ig, "e$21");
	intermediatePinyin = intermediatePinyin.replace(/(ū)([iaeouü]*)/ig, "u$21");
	intermediatePinyin = intermediatePinyin.replace(/(ī)([iaeouü]*)/ig, "i$21");
	intermediatePinyin = intermediatePinyin.replace(/(ō)([iaeouü]*)/ig, "o$21");
	intermediatePinyin = intermediatePinyin.replace(/(ǖ)([iaeouü]*)/ig, "v$21");
	
	// Tone 2;
	intermediatePinyin = intermediatePinyin.replace(/(á)([iaeouü]*)/ig, "a$22");
	intermediatePinyin = intermediatePinyin.replace(/(é)([iaeouü]*)/ig, "e$22");
	intermediatePinyin = intermediatePinyin.replace(/(ú)([iaeouü]*)/ig, "u$22");
	intermediatePinyin = intermediatePinyin.replace(/(í)([iaeouü]*)/ig, "i$22");
	intermediatePinyin = intermediatePinyin.replace(/(ó)([iaeouü]*)/ig, "o$22");
	intermediatePinyin = intermediatePinyin.replace(/(ǘ)([iaeouü]*)/ig, "v$22");
	
	// Tone 3
	intermediatePinyin = intermediatePinyin.replace(/(ǎ)([iaeouü]*)/ig, "a$23");
	intermediatePinyin = intermediatePinyin.replace(/(ě)([iaeouü]*)/ig, "e$23");
	intermediatePinyin = intermediatePinyin.replace(/(ǔ)([iaeouü]*)/ig, "u$23");
	intermediatePinyin = intermediatePinyin.replace(/(ǐ)([iaeouü]*)/ig, "i$23");
	intermediatePinyin = intermediatePinyin.replace(/(ǒ)([iaeouü]*)/ig, "o$23");
	intermediatePinyin = intermediatePinyin.replace(/(ǚ)([iaeouü]*)/ig, "v$23");

	// Tone 4
	intermediatePinyin = intermediatePinyin.replace(/(à)([iaeouü]*)/ig, "a$24");
	intermediatePinyin = intermediatePinyin.replace(/(è)([iaeouü]*)/ig, "e$24");
	intermediatePinyin = intermediatePinyin.replace(/(ù)([iaeouü]*)/ig, "u$24");
	intermediatePinyin = intermediatePinyin.replace(/(ì)([iaeouü]*)/ig, "i$24");
	intermediatePinyin = intermediatePinyin.replace(/(ò)([iaeouü]*)/ig, "o$24");
	intermediatePinyin = intermediatePinyin.replace(/(ǜ)([iaeouü]*)/ig, "v$24");
	
	// Tone 0
	// Add tone 0
	intermediatePinyin = intermediatePinyin.replace(/(å)([iaeouü]*)/ig, "a$20");
	intermediatePinyin = intermediatePinyin.replace(/"e̊([iaeouü]*)/ig, "e$20");
	intermediatePinyin = intermediatePinyin.replace(/(ů)([iaeouü]*)/ig, "u$20");
	intermediatePinyin = intermediatePinyin.replace(/"i̊([iaeouü]*)/ig, "i$20");
	intermediatePinyin = intermediatePinyin.replace(/"o̊([iaeouü]*)/ig, "o$20");
	intermediatePinyin = intermediatePinyin.replace(/"ü̊([iaeouü]*)/ig, "v$20");

	// Syllables without a tone symbol are tone 0;
	intermediatePinyin = intermediatePinyin.replace(/([aeuiov]+)([^0-9aeuiov]|\W|$)/g, "$10$2");

	// Move numbers to the end of the syllable.
	// Syllables ending in n and start with g. Note that a syllable cannot start with an u or i
	intermediatePinyin = intermediatePinyin.replace(/([aeuiov])([0-9])(n)(g[aeuiov])/ig, "$1$3$2$4");
	// Syllables ending in (ng?) followed by something that is not a valid vowel 
	intermediatePinyin = intermediatePinyin.replace(/([aeuiov])([0-9])(ng?)([^aeuiov]|$W|$)/ig, "$1$3$2$4");
	// Syllables ending in r
	intermediatePinyin = intermediatePinyin.replace(/([aeuiov])([0-9])(r)([^aeuiov]|$W|$)/ig, "$1$3$2$4");
	// Remove quotes etc
	intermediatePinyin = intermediatePinyin.replace(/[\'\`]/, "", 0)
	
	return intermediatePinyin;
};

// file can be a local file or an url
function processWordlist (file, allText, delimiter, optionalName=false) {
	var nameList = ["Pinyin", "Marks", "Character", "Translation", "Part", "Sound"];
	var rows = processCSV (file, allText, delimiter);
	var url = "";
	var wordlistName;
	var type = ".tsv";
	if (file.name) {
		type = file.name.match(/(tsv|csv|Table|txt)$/)[0];
		wordlistName = file.name.replace(/\.[^\.]*$/g, "");
	} else if (optionalName && file.match(/^blob\:/ig)) {
		wordlistName = optionalName;
		type = wordlistName.match(/(tsv|csv|Table|txt)$/)[0];
		wordlistName = wordlistName.replace(/\.[^\.]*$/g, "");
	} else {
		var matchRes = file.match(/[^\/\.]+\.(Table|tsv|csv|txt)/g);
		wordlistName = matchRes[0].replace(/\.[^\.]+/g, "");
		type = file.match(/(tsv|csv|Table|txt)$/)[0];
		url = file.replace(/[^\/]+$/g, "");
		// Embedded wordlist file
		if (wordlistName == "wordlist") {
			wordlistName = url.match(/\/[^\/]+\/$/)[0];
			wordlistName = wordlistName.replace(/\//g, "");
		};
	};
	wordlistName = wordlistName.replace(/_/g, " ");
	var newWordlist = [wordlistName];
	var wordlistEntries = [];
	var header = rows.shift();
	if (type == "txt") {
		header = ["Pinyin", "Character", "Translation", "Part", "Sound", "Marks"].slice(0, header.length);
	};
	
	var columnNums = {Pinyin: -1, Marks: -1, Character: -1, Translation: -1, Part: -1, Sound: -1};
	for (var c in header) {
		columnNums [header[c]] = c;
	};
	for (var r=0; r < rows.length; ++r) {
		var currentRow = rows[r];
		var newEntry = []
		for (var c=0; c < nameList.length; ++c) {
			var value = "-";
			if (columnNums[nameList[c]] > -1) {
				value = currentRow[columnNums[nameList[c]]];
				// Prepend the URL path to sounds
				if (nameList[c] == "Sound" && value.match(/\w/) && ! value.match(/(blob:|:\/\/)/)) {
					value = url+value;
				};
			};
			newEntry.push(value)
		};
		if (!newEntry[0].match(/\d/)) {
			newEntry[1] = newEntry[0];
			newEntry[0] = tonemarksToNumbers (newEntry[1]);
		} else if (newEntry[1] == "-") {
			newEntry[1] = numbersToTonemarks(newEntry[0]);
		};
		wordlistEntries.push(newEntry);
	};
	// Merge rows with name
	newWordlist.push(wordlistEntries);
	// Add the new wordlist to the current wordlists
	sgc3_settings.personalWordlists = addNewWordlist(sgc3_settings.personalWordlists, newWordlist);
	wordlists = combineWordlistLists(global_wordlists, sgc3_settings.personalWordlists);
	get_wordlist (sgc3_settings.wordList);
	// Force new worlists into local storage
	localStorage.sgc3_personalWordlists = JSON.stringify(sgc3_settings.personalWordlists);
	if (document.getElementById('CurrentWordlist')) {
		// Set new current, but only if it was selected manually
		sgc3_settings.wordList = newWordlist[0];
		localStorage.sgc3_wordList = JSON.stringify(sgc3_settings.wordList);
		localStorage.sgc3_currentWord = JSON.stringify(0);
		document.getElementById('CurrentWordlist').textContent = sgc3_settings.wordList;
		var isDeletable = wordlistExist (sgc3_settings.personalWordlists, sgc3_settings.wordList);
		document.getElementById('CurrentWordlist').style.color = isDeletable ? "blue" : "gray";
		document.getElementById('DeleteWordlistButton').style.color = isDeletable ? "black" : "gray";
		document.getElementById('DeleteWordlistButton').disabled = !isDeletable;
		if (sgc3_settings.shuffleLists) currentWordlist.shuffle();
	};
	// Reset screens
	load_SGC3_settings ();
};

function readWordlist (file, name=false) {
	var delimiter = csvDelimiter;
	if(file) {
		if (file.name && file.name.match(/\.(tsv|Table)\s*$/i)) {
			delimiter = "\t";
		} else if(file.match(/\.(tsv|Table)\s*$/i)) {
				delimiter = "\t";
		} else if(name && name.match(/\.(tsv|Table)\s*$/i)) {
				delimiter = "\t";
		} else if(name && name.match(/\.(txt)\s*$/i)) {
				delimiter = "?";
		};
		readDelimitedTextFile(file, processWordlist, delimiter, name);
	};
};

// Example use
// readWordlist ("file:///Users/robvanson/Werk/Software/sgc3/20_basic_tone_combinations.Table");


var global_wordlists = [
		[
		"20 basic tone combinations", [
			["yi1sheng1","yīshēng","医生","doctor","-","-"],
			["zhong1guo2","zhōngguó","中国","China","-","-"],
			["zhong1wu3","zhōngwǔ","中午","noon","-","-"],
			["zhi1dao4","zhīdào","知道","to know","-","-"],
			["ma1ma","māma","妈妈","mother","-","-"],
			["xue2sheng1","xuéshēng","学生","student","-","-"],
			["chang2chang2","chángcháng","常常","often","-","-"],
			["peng2you3","péngyǒu","朋友","friend","-","-"],
			["bu2shi4","búshì","不是","be not","-","-"],
			["shen2me","shénme","什么","what","-","-"],
			["lao3shi1","lǎoshī","老师","teacher","-","-"],
			["mei3guo2","měiguó","美国","USA","-","-"],
			["ni3hao3","nǐhǎo","你好","hello!","-","-"],
			["qing3wen4","qǐngwèn","请问","May I ask..?","-","-"],
			["dong3le","dǒngle","懂了","understood","-","-"],
			["da4jia1","dàjiā","大家","everyone","-","-"],
			["da4xue2","dàxué","大学","university","-","-"],
			["tiao4wu3","tiàowǔ","跳舞","to dance","-","-"],
			["zai4jian4","zàijiàn","再见","Good bye!","-","-"],
			["xie4xie","xièxie","谢谢","Thanks!","-","-"]
			]
		],
		[
		"An example wordlist", [
			["chi1","chī","吃","to eat","-","-"],
			["ta1","tā","他,她,它","he, she, it","-","-"],
			["jin1tian1","jīntiān","今天","today","-","-"],
			["can1ting1","cāntīng","餐厅","restaurant","-","-"],
			["huan1ying2","huānyíng","欢迎","to welcome","-","-"],
			["zhong1guo2","zhōngguó","中国","China","-","-"],
			["duo1shao3","duōshǎo","多少","how many","-","-"],
			["zhi3you3","zhǐyǒu","只有","only","-","-"],
			["sheng1ri4","shēngrì","生日","birthday","-","-"],
			["gao1xing4","gāoxìng","高兴","happy","-","-"],
			["ma1ma0","māma","妈妈","mama","-","-"],
			["ge1ge0","gēge","哥哥","older brother","-","-"],
			["ren2","rén","人","person","-","-"],
			["qian2","qián","前","front","-","-"],
			["shi2jian1","shíjiān","时间","time","-","-"],
			["jie2hun1","jiéhūn","结婚","to marry","-","-"],
			["chang2cheng2","chángchéng","长城","the Great Wall","-","-"],
			["xue2xi2","xuéxí","学习","to study","-","-"],
			["mei2you3","méiyǒu","没有","haven't","-","-"],
			["you2yong3","yóuyǒng","游泳","to swim","-","-"],
			["fo2jiao4","fójiào","佛教","Buddhism","-","-"],
			["hai2shi4","háishì","还是","or","-","-"],
			["shen2me0","shénme","什么","what","-","-"],
			["peng2you0","péngyou","朋友","friend","-","-"],
			["wo3","wǒ","我","I, me","-","-"],
			["xiang3","xiǎng","享","to enjoy","-","-"],
			["xiang3","xiǎng","想","to think","-","-"],
			["xi3huan0","xǐhuan","喜欢","to like","-","-"],
			["yi3jing1","yǐjīng","已经","already","-","-"],
			["lv3xing2","lǚxíng","旅行","to travel","-","-"],
			["qi3chuang2","qǐchuáng","起床","to get up","-","-"],
			["ni3hao3","nǐhǎo","你好","hello","-","-"],
			["mei3li4","měilì","美丽","beautiful","-","-"],
			["nv3shi4","nǚshì","女士","lady","-","-"],
			["xiao3jie3","xiǎojiě","小姐","miss","-","-"],
			["na3li3","nǎlǐ","哪里","where","-","-"],
			["yi1","yī","一","one","-","-"],
			["er4","èr","二","two","-","-"],
			["san1","sān","三","three","-","-"],
			["si4","sì","四","four","-","-"],
			["wu3","wǔ","五","five","-","-"],
			["liu4","liù","六","six","-","-"],
			["qi1","qī","七","seven","-","-"],
			["ba1","bā","八","eight","-","-"],
			["jiu3","jiǔ","九","nine","-","-"],
			["shi2","shí","十","ten","-","-"],
			["bai3","bǎi","百","hundred","-","-"],
			["qian1","qiān","千","thousand","-","-"],
			["shi4","shì","是","is","-","-"],
			["tui4xiu1","tuìxiū","退休","retirement","-","-"],
			["hou4tian1","hòutiān","后天","day after tomorrow","-","-"],
			["shang4xue2","shàngxué","上学","to attend school","-","-"],
			["ji4jie2","jìjié","季节","season","-","-"],
			["zi4ji3","zìjǐ","自己","self","-","-"],
			["xia4wu3","xiàwǔ","下午","afternoon","-","-"],
			["dian4hua4","diànhuà","电话","telephone","-","-"],
			["zai4jian4","zàijiàn","再见","goodbye","-","-"],
			["xie4xie0","xièxie","谢谢","thanks","-","-"],
			["mei4mei0","mèimei","妹妹","younger sister","-","-"],
			["re4ma0","rèma","热吗","is it hot? (吗: yes/no question particle)","-","-"],
			["ni3ne0","nǐne","你呢","how about you? (呢: question particle)","-","-"],
			["re4","rè","热","hot","-","-"]
			]
		],
		[
		"Chinees een Makkie chapters 1 + 2", [
			["ni3hao3","nǐhǎo","你好","hello, how are you","-","-"],
			["ni3","nǐ","你","you (singular)","-","-"],
			["hao3","hǎo","好","good, fine","-","-"],
			["wo3","wǒ","我","I, me, my","-","-"],
			["jiao4","jiào","叫","to be called, to shout","-","-"],
			["shi4","shì","是","is, to be","-","-"],
			["he2lan2","hélán","荷兰","Holland, the Netherlands","-","-"],
			["ren2","rén","人","man, person, people","-","-"],
			["hen3","hěn","很","very, quite","-","-"],
			["re4ma0","rèma","热吗","is it hot? (吗: yes/no question particle)","-","-"],
			["ye3","yě","也","also, too","-","-"],
			["xie4xie0","xièxie","谢谢","thank you","-","-"],
			["zai4jian4","zàijiàn","再见","goodbye","-","-"],
			["ni3ne0","nǐne","你呢","how about you? (呢: particle indicating a question)","-","-"],
			["zhong1guo2","zhōngguó","中国","China","-","-"],
			["de2guo2","déguó","德国","Germany","-","-"],
			["fa3guo2","fǎguó","法国","France","-","-"],
			["ming2tian1","míngtiān","明天","tomorrow","-","-"],
			["xia4wu3","xiàwǔ","下午","afternoon","-","-"],
			["wan3an1","wǎnān","晚安","good evening, good night","-","-"],
			["jian4","jiàn","见","to see, to meet","-","-"],
			["shen2me0","shénme","什么","what, who?","-","-"],
			["zhu4","zhù","住","to live, to stay","-","-"],
			["zai4","zài","在","at, in","-","-"],
			["nar3","nǎr","哪儿","where?","-","-"],
			["re4","rè","热","hot","-","-"]
			]
		],
		[
		"Chinese for Today chapters 1 + 2", [
			["huan1ying2","huānyíng","欢迎","to welcome, welcome","-","-"],
			["nin2","nín","您","you (courteous)","-","-"],
			["hao3","hǎo","好","good, fine","-","-"],
			["nin2hao3","nínhǎo","您好","hello (polite)","-","-"],
			["hua2qiao2","huáqiáo","华侨","overseas Chinese (emigrant)","-","-"],
			["ni3","nǐ","你","you","-","-"],
			["qing3wen4","qǐngwèn","请问","excuse me, may I ask...?","-","-"],
			["shi4","shì","是","is, to be","-","-"],
			["xian1sheng0","xiānsheng","先生","mister (mr.)","-","-"],
			["re4","rè","热","hot","-","-"],
			["re4ma0","rèma","热吗","is it hot? (吗: yes/no question particle)","-","-"],
			["wo3","wǒ","我","I, me","-","-"],
			["bu4","bù","不","not, no","-","-"],
			["mei2","méi","没","have not, not (prefix for verbs)","-","-"],
			["guan1xi0","guānxi","关系","relation, to concern","-","-"],
			["zai4jian4","zàijiàn","再见","goodbye","-","-"],
			["dui4","duì","对","right, correct","-","-"],
			["ni3de0","nǐde","你的","your (的: possessive particle)","-","-"],
			["jiao4","jiào","叫","to shout, to be called","-","-"],
			["xie4xie0","xièxie","谢谢","thanks","-","-"],
			["xiao3jie3","xiǎojiě","小姐","miss","-","-"],
			["lv3you2","lǚyóu","旅游","trip, journey, travel","-","-"],
			["na4me0","nàme","那么","like that, so","-","-"],
			["yi2ding4","yídìng","一定","surely, certainly","-","-"],
			["jie4shao4","jièshào","介绍","to introduce, to present","-","-"],
			["qing3","qǐng","请","to ask, to invite","-","-"],
			["jin4","jìn","进","to enter, to advance","-","-"],
			["qing3jin4","qǐngjìn","请进","please come in","-","-"],
			["a4","à","啊","uhm, Ah OK","-","-"],
			["lao3","lǎo","老","old, venerable (of people)","-","-"],
			["zuo4","zuò","坐","to sit, to take a seat (also a bus, airplane etc) ","-","-"],
			["chou1yan1","chōuyān","抽烟","to smoke (tobacco)","-","-"],
			["hui4","huì","会","can, to be possible","-","-"],
			["lai2","lái","来","to come, to arrive","-","-"],
			["yi2xia4","yíxià","一下","give it a go, one time","-","-"],
			["zhe4","zhè","这","this","-","-"],
			["tai4tai0","tàitai","太太","mrs., madam, wife","-","-"],
			["bo2bo0","bóbo","伯伯","father's elder brother, uncle","-","-"],
			["nv3er2","nǚ'ér","女儿","daughter","-","-"],
			["na4","nà","那","that, those","-","-"],
			["er2zi0","érzi","儿子","son","-","-"],
			["ni3men0","nǐmen","你们","you (plural, 们: plural marker)","-","-"],
			["he1","hē","喝","to drink","-","-"],
			["cha2","chá","茶","tea","-","-"],
			["ye2ye0","yéye","爷爷","grandfather (father's father)","-","-"],
			["nai3nai0","nǎinai","奶奶","grandma (father's mother)","-","-"],
			["shu1shu0","shūshu","叔叔","uncle (father's younger brother)","-","-"],
			["pi2jiu3","píjiǔ","啤酒","beer","-","-"],
			["ka1fei1","kāfēi","咖啡","coffee","-","-"],
			["a2","á","啊","eh? what? (interjection)","-","-"],
			["hao3a0","hǎo'a","好啊","Good! (啊: affirmative, approval, consent)","-","-"],
			["ha1","hā","哈","laughter, yawn","-","-"]
			]
		],
		[
		"Colloquial Chinese chapters 1 + 2", [
			["chu1","chū","出","to go out","-","-"],
			["ci4","cì","次","secondary, next (classifier)","-","-"],
			["jian4mian4","jiànmiàn","见面","to meet","-","-"],
			["ni3","nǐ","你","you","-","-"],
			["shi4","shì","是","is, to be","-","-"],
			["xian1sheng0","xiānsheng","先生","mister (mr.)","-","-"],
			["re4ma0","rèma","热吗","is it hot? (吗: yes/no question particle)","-","-"],
			["shi4de0","shìde","是的","yes, that's right","-","-"],
			["wo3","wǒ","我","I, me, my","-","-"],
			["hao3","hǎo","好","good, fine","-","-"],
			["ni3hao3","nǐhǎo","你好","hello, how are you","-","-"],
			["hen3","hěn","很","very, quite","-","-"],
			["gao1xing4","gāoxìng","高兴","happy","-","-"],
			["jian4dao4","jiàndào","见到","to see","-","-"],
			["ye3","yě","也","also, too","-","-"],
			["jiao4","jiào","叫","to be called, to shout","-","-"],
			["lao3","lǎo","老","old, venerable (of people)","-","-"],
			["dui4ba0","duìba","对吧","isn't it? (吧: modal particle)","-","-"],
			["hao3de0","hǎode","好的","Ok","-","-"],
			["qing3","qǐng","请","to ask, to invite","-","-"],
			["huan1ying2","huānyíng","欢迎","to welcome, welcome","-","-"],
			["lai2","lái","来","to come, to arrive","-","-"],
			["zhong1guo2","zhōngguó","中国","China","-","-"],
			["ni3de0","nǐde","你的","your (的: possessive particle)","-","-"],
			["yi1lu4","yīlù","一路","all the way","-","-"],
			["shun4li4","shùnlì","顺利","smoothly","-","-"],
			["xie4xie0","xièxie","谢谢","thank you","-","-"],
			["lei4","lèi","类","kind, type, class","-","-"],
			["you3","yǒu","有","to have, there is","-","-"],
			["yi1dian3","yīdiǎn","一点","a bit, a little","-","-"],
			["xiang3","xiǎng","享","to enjoy","-","-"],
			["he1","hē","喝","to drink","-","-"],
			["yi1","yī","一","one","-","-"],
			["yi1bei1","yībēi","一杯","cup","-","-"],
			["ka1fei1","kāfēi","咖啡","coffee","-","-"],
			["tai4","tài","太","too, very, highest, greatest","-","-"],
			["chi1","chī","吃","to eat","-","-"],
			["chi1le0","chīle","吃了","ate (了: completed action marker)","-","-"],
			["zhe4","zhè","这","this","-","-"],
			["bu4","bù","不","not, no","-","-"],
			["ke4qi0","kèqi","客气","polite, courteous","-","-"],
			["xing4ming2","xìngmíng","姓名","name and surname","-","-"],
			["guo2ji2","guójí","国籍","nationality","-","-"],
			["he2","hé","和","and, with","-","-"],
			["nian2ling2","niánlíng","年龄","(a person's) age","-","-"],
			["hui4","huì","会","can, to be possible","-","-"],
			["shuo1","shuō","说","to speak, to say","-","-"],
			["zhong1wen2","zhōngwén","中文","Chinese (written language)","-","-"],
			["xiao3","xiǎo","小","small, tiny, few","-","-"],
			["shen2me0","shénme","什么","what, who?","-","-"],
			["ying1guo2","yīngguó","英国","England (UK)","-","-"],
			["ren2","rén","人","man, person, people","-","-"],
			["na3","nǎ","哪","how, which","-","-"],
			["guo2","guó","国","country","-","-"],
			["cai1","cāi","猜","to guess","-","-"],
			["zhi1dao4","zhīdào","知道","to know","-","-"],
			["mei3guo2","měiguó","美国","USA","-","-"],
			["na3li3","nǎlǐ","哪里","where","-","-"],
			["Bei3jing1","Běijīng","北京","Beijing","-","-"],
			["jin1nian2","jīnnián","今年","this year","-","-"],
			["duo1","duō","多","many, much","-","-"],
			["da4","dà","大","big","-","-"],
			["sui4","suì","岁"," years of age (classifier)","-","-"],
			["zhen1de0","zhēnde","真的","really","-","-"],
			["zhi3you3","zhǐyǒu","只有","only","-","-"],
			["zuo3you4","zuǒyòu","左右","left and right, nearby","-","-"],
			["guo4jiang3","guòjiǎng","过奖","flatter","-","-"],
			["zhen1","zhēn","真","really","-","-"],
			["nian2qing1","niánqīng","年轻","young","-","-"],
			["zhe4me0","zhème","这么","so much, how much?","-","-"],
			["ying1gai1","yīnggāi","应该","ought to, should","-","-"],
			["dui4","duì","对","right, correct","-","-"],
			["ren4shi0","rènshi","认识","to know, to recognize","-","-"],
			["zai4jian4","zàijiàn","再见","goodbye","-","-"],
			["re4","rè","热","hot","-","-"]
			]
		],
		[
		"Contemporary Chinese chapters 1 + 2", [
			["ming2zi4","míngzì","名字","name (of a person or thing)","-","-"],
			["guo2","guó","国","country","-","-"],
			["dou1","dōu","都","all","-","-"],
			["shuo1","shuō","说","to speak, to say","-","-"],
			["han4yu3","hànyǔ","汉语","Chinese language","-","-"],
			["zhong1guo2","zhōngguó","中国","China","-","-"],
			["na3","nǎ","哪","how, which","-","-"],
			["lao3shi1","lǎoshī","老师","teacher","-","-"],
			["ying1yu3","yīngyǔ","英语","English (language)","-","-"],
			["fa3yu3","fǎyǔ","法语","French (language)","-","-"],
			["hai2shi4","háishì","还是","or, still, nevertheless","-","-"],
			["xing4","xìng","兴","interest in something","-","-"],
			["tong2xue2","tóngxué","同学","classmate","-","-"],
			["zhi3","zhǐ","只","only, but","-","-"],
			["yi1dian3","yīdiǎn","一点","a bit, a little","-","-"],
			["peng2you0","péngyou","朋友","friend","-","-"],
			["qing3","qǐng","请","to ask, to invite","-","-"],
			["xue2xi2","xuéxí","学习","to learn, to study","-","-"],
			["zai4","zài","在","at, in","-","-"],
			["dian4hua4","diànhuà","电话","telephone","-","-"],
			["dian4zi3","diànzǐ","电子","electronic, electron","-","-"],
			["you2jian4","yóujiàn","邮件","mail, post","-","-"],
			["zen3me0","zěnme","怎么","how? what?","-","-"],
			["da4xue2","dàxué","大学","university","-","-"],
			["ke3yi3","kěyǐ","可以","can, may, possible","-","-"],
			["dong1fang1","dōngfāng","东方","east","-","-"],
			["xue2yuan4","xuéyuàn","学院","college, school","-","-"],
			["zhe4","zhè","这","this","-","-"],
			["gong1zuo4","gōngzuò","工作","to work","-","-"],
			["xi3huan1","xǐhuān","喜欢","to like, to be fond of","-","-"]
			]
		],
		[
		"Elementary Chinese", [
			["bao4","bào","报","newspaper","3","-"],
			["da4","dà","大","big","3","-"],
			["duo1","duō","多","many, much","3","-"],
			["guo2","guó","国","country","3","-"],
			["mai3","mǎi","卖","to buy","3","-"],
			["ni3","nǐ","你","you","3","-"],
			["shi2","shí","十","10","3","-"],
			["ta1","tā","他","he, him","3","-"],
			["wo3","wǒ","我","I, me","3","-"],
			["yue4","yuè","月","month","3","-"],
			["chang2","cháng","长","long","4","-"],
			["chi1","chī","吃","to eat","4","-"],
			["qu4","qù","去","to go","4","-"],
			["shui3","shuǐ","水","water","4","-"],
			["xi3","xǐ","洗","to wash","4","-"],
			["xin1","xīn","新","new","4","-"],
			["xin4","xìn","信","letter","4","-"],
			["yuan2","yuán","圆","round","4","-"],
			["zao3","zǎo","早","early","4","-"],
			["zhi3","zhǐ","纸","paper","4","-"],
			["cheng2gong1","chénggōng","成功","success","5","-"],
			["di4tu2","dìtú","地图","map","5","-"],
			["dian4deng1","diàndēng","电灯","electric light","5","-"],
			["gong1zuo4","gōngzuò","工作","work","5","-"],
			["jin4bu4","jìnbù","进度","progress","5","-"],
			["lao2dong4","láodòng","劳动","to do physical labor","5","-"],
			["qian1bi3","qiānbǐ","铅笔","pencil","5","-"],
			["shi2tang2","shítáng","食堂","dining hall","5","-"],
			["wo4shou3","wòshǒu","握手","to shake hands","5","-"],
			["zong1wen2","zōngwén","中文","Chinese language","5","-"],
			["bei1zi0","bēizi","杯子","cup","6","-"],
			["Bei3jing1","Běijīng","北京","Beijing","6","-"],
			["ben3zi0","běnzi","本子","note-book, exercise book","6","-"],
			["dai4fu0","dàifu","大夫","doctor","6","-"],
			["fu3dao3","fǔdǎo","辅导","to coach","6","-"],
			["gong3gu4","gǒnggù","巩固","to consolidate","6","-"],
			["lao3shi1","lǎoshī","老师","teacher","6","-"],
			["ti2mu4","tímù","题目","problem, title","6","-"],
			["xiao3zu3","xiǎozǔ","小组","group","6","-"],
			["yu3yan2","yǔyán","语言","language","6","-"],
			["kao3shi4","kǎoshì","考试","examination","7","-"],
			["lian4xi2","liànxí","练习","exercise","7","-"],
			["qing1chu0","qīngchu","清楚","clear","7","-"],
			["sheng1diao4","shēngdiào","声调","tone","7","-"],
			["xue2xiao4","xuéxiào","学校","school","7","-"],
			["xue2sheng0","xuésheng","学生","student","7","-"],
			["yu3fa3","yǔfǎ","语法","grammar","7","-"],
			["zao3shang0","zǎoshang","早上","morning","7","-"],
			["wen4ti2","wèntí","问题","question, problem","7","-"],
			["zhu4yi4","zhùyì","注意","to pay attention to","7","-"],
			["cao1chang3","cāochǎng","操场","playground","8","-"],
			["ce4yan4","cèyàn","测验","test","8","-"],
			["jian3cha2","jiǎnchá","检查","to examine","8","-"],
			["kun4nan2","kùnnán","困难","difficulty","8","-"],
			["qi4che1","qìchē","汽车","automobile","8","-"],
			["shui4jiao4","shuìjiào","睡觉","to sleep","8","-"],
			["su4she4","sùshè","宿舍","dormitory","8","-"],
			["zai4jian4","zàijiàn","再见","good-bye","8","-"],
			["zheng3qi2","zhěngqí","整齐","orderly, neat","8","-"],
			["zhun3bei4","zhǔnbèi","准备","to prepare","8","-"],
			["hao3","hǎo","好","well, good","9","-"],
			["qing3","qǐng","请","please","9","-"],
			["jin4","jìn","进","to come in, enter","9","-"],
			["zuo4","zuò","坐","to sit","9","-"],
			["xie4xie0","xièxie","谢谢","thanks","9","-"],
			["shi4","shì","是","to be","9","-"],
			["na3","nǎ","哪","which","9","-"],
			["ren2","rén","人","person, man","9","-"],
			["jiao4","jiào","叫","to call","9","-"],
			["shen2me0","shénme","什么","what","9","-"],
			["ming2zi0","míngzi","名字","name","9","-"],
			["hui4","huì","会","to know (a language), to know how to","9","-"],
			["re4ma0","rèma","热吗","is it hot? (吗: yes/no interrogative particle)","9","-"],
			["bu4","bù","不","not, no","9","-"],
			["ying1wen2","yīngwén","英文","English language","9","-"],
			["xue2xi2","xuéxí","学习","to study","9","-"],
			["zai4","zài","在","to be (in, on, at, etc.)","9","-"],
			["nar3","nǎr","哪儿","where","9","-"],
			["re4","rè","热","hot","9","-"],
			["shang4wu3","shàngwǔ","上午","morning","10","-"],
			["you3","yǒu","有","to have, there be","10","-"],
			["ke4","kè","课","class, lesson","10","-"],
			["xia4wu3","xiàwǔ","下午","afternoon","10","-"],
			["ye3","yě","也","also","10","-"],
			["dui4le0","duìle","对了","yes, right","10","-"],
			["wan3shang0","wǎnshang","晚上","evening","10","-"],
			["mei2","méi","没","not (with 有)","10","-"],
			["mei2you3","méiyǒu","没有","to not have, there isn't","10","-"],
			["jiao4shi4","jiàoshì","教室","classroom","10","-"],
			["fu4xi2","fùxí","复习","to review","10","-"],
			["fa1yin1","fāyīn","发音","pronunciation","10","-"],
			["xie3","xiě","写","to write","10","-"],
			["han4zi4","hànzì","汉字","Chinese character","10","-"],
			["sheng1ci2","shēngcí","生词","new word","10","-"],
			["zhe4","zhè","这","this","11","-"],
			["di4fang0","dìfang","地方","place","11","-"],
			["li3tang2","lǐtáng","礼堂","auditorium","11","-"],
			["na4","nà","那","that","11","-"],
			["shang1dian4","shāngdiàn","商店","shop","11","-"],
			["tu2shu1guan3","túshūguǎn","图书馆","library","11","-"],
			["zher4","zhèr","这儿","here","11","-"],
			["nar4","nàr","那儿","there","11","-"],
			["xian4zai4","xiànzài","现在","now","11","-"],
			["duan4lian4","duànliàn","锻炼","to do physical training","11","-"],
			["da3","dǎ","打","to play, to beat, to hit","11","-"],
			["qiu2","qiú","球","ball","11","-"],
			["dong1xi0","dōngxi","东西","thing","11","-"],
			["shu1dian4","shūdiàn","书店","bookstore","11","-"],
			["shu1","shū","书","book","11","-"],
			["da3","dǎ","打","to make (a telephone call)","12","-"],
			["dian4hua4","diànhuà","电话","telephone","12","-"],
			["wei4","wèi","喂","hallo","12","-"],
			["deng3","děng","等","to wait","12","-"],
			["kan4","kàn","看","to see, to have a look, to look","12","-"],
			["chu1qu0","chūqu","出去","to go out","12","-"],
			["shi4qing0","shìqing","事情","thing business","12","-"],
			["xiang3","xiǎng","想","to think","12","-"],
			["gen1","gēn","跟","with, and","12","-"],
			["tan2","tán","谈","to talk","12","-"],
			["shi2hou0","shíhou","时候","time","12","-"],
			["hui2lai0","huílai","回来","to come back","12","-"],
			["yi3hou4","yǐhòu","以后","later, after","12","-"],
			["gei3","gěi","给","to give, for","12","-"],
			["dui4ba0","duìba","对吧","isn't it? (吧: modal particle)","12","-"],
			["duo1shao0","duōshao","多少","how many, how much","12","-"],
			["hai2","hái","还","else, any other, still","12","-"],
			["ta1","tā","她","she, her","13","-"],
			["ta1","tā","他,她,它","he, she, it","13","-"],
			["nin2","nín","您","you (polite form)","13","-"]
			]
		]
	]

wordlists = global_wordlists.slice();
