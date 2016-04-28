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

var userLanguage = (navigator.language) ? navigator.language : navigator.userLanguage;
userLanguage = userLanguage.substr(0,2).toUpperCase();

function insert_and_update_options (labels) {
	for(x in labels) {
		if(document.getElementById(x) && ! x.match(/_/)) {
			document.getElementById(x).title = labels[x][1];
			var defaultText = document.getElementById(x+"Caption");
			if (defaultText) defaultText.textContent = labels[x][0];
			var defaultText2 = document.getElementById(x+"Caption2");
			if (defaultText2) defaultText2.textContent = labels[x][0];
		} else if (x.match(/_/)) {
			var Id = x.replace(/_[^_]*$/, "");
			var value = x.replace(/^[^_]*_/, "");
			if (document.getElementById(x)) {
				document.getElementById(x).value = value;
				document.getElementById(x).text = labels[x][0];
			} else {
				if(document.getElementById(Id)) {
					var selector = document.getElementById(Id);
					var newOption = selector.options[0].cloneNode(true);
					newOption.value = value;
					newOption.text = labels[x][0];
					newOption.id = x;
					selector.add(newOption);
				};
			};
		};
	};
};

function set_mainpageLanguage (language) {
	var labels = mainpage_tables[language];
	for(x in labels) {
		if(document.getElementById(x)) {
			document.getElementById(x).textContent = labels[x][0];
			document.getElementById(x).parentNode.parentNode.title = labels[x][1];
		};
	};
	
	labels = selector_tables[language];
	insert_and_update_options (labels);
	
	labels = language_table;
	insert_and_update_options (labels);
	
	// Set selector index
	for(var x = 0; x < document.getElementById("Language").options.length; ++ x) {
		if (document.getElementById("Language").options[x].value == language) {
			document.getElementById("Language").selectedIndex = x;
		};
	};
	
	localStorage.language = JSON.stringify(language);
};

function set_configLanguage (language) {
	var labels = config_tables[language];
	for(x in labels) {
		if(document.getElementById(x)) {
			document.getElementById(x).textContent = labels[x][0];
			document.getElementById(x).parentNode.parentNode.title = labels[x][1];
		};
	};
	
	labels = selector_tables[language];
	insert_and_update_options (labels);
	
	labels = language_table;
	insert_and_update_options (labels);
	
	// Set selector index
	if (document.getElementById("Language")) {
		for(var x = 0; x < document.getElementById("Language").options.length; ++ x) {
			if (document.getElementById("Language").options[x].value == language) {
				document.getElementById("Language").selectedIndex = x;
			};
		};
	};
	localStorage.language = JSON.stringify(language);
};

function change_mainpageLanguage () {
	var index = document.getElementById("Language").selectedIndex;
	var value = document.getElementById("Language").options[index].value;
	userLanguage = value;
	set_mainpageLanguage (userLanguage);
	return userLanguage;
};

function change_configLanguage () {
	var index = document.getElementById("Language").selectedIndex;
	if (index > 0) {
		var value = document.getElementById("Language").options[index].value;
		userLanguage = value;
		set_configLanguage (userLanguage);
	} else {
		set_configLanguage (userLanguage)
	};
	return userLanguage;
};

var mainpage_tables = {
	ZH: {
		Config: ["设置 S", "切换到设置页面。"],
		Record: ["录音", "录音。录音时间为4秒钟，注意“录音指示灯”。"],
		Play: ["播放", "播放您的发音。"],
		Example: ["参考发音", "播放软件提供的参考发音。"],
		Previous: ["上一个", "切换到上一个单词。"],
		Next: ["下一个", "切换到下一个单词。"],
		WordlistCaption: ["单词表", "更换单词表。"],
		SelectWords: ["选择单词", "选择要练习的单词"],
		WordlistUp: ["上一个", "切换到上一个单词表。"],
		WordlistDown: ["下一个", "切换到下一个单词表。"]
		},
	EN: {
		Config: ["Settings", "Go to settings page"],
		Record: ["Record", "Record your pronunciation. You have 4 seconds, watch the recording 'light'"],
		Play: ["Play", "Play back of your recorded pronunciation"],
		Example: ["Example", "Play example tone pronunciation"],
		Previous: ["Previous", "Previous word"],
		Next: ["Next", "Next word"],
		WordlistCaption: ["Word List", "Change word list"],
		SelectWords: ["Words", "Select words to practise"],
		WordlistUp: ["Previous", "Previous word list"],
		WordlistDown: ["Next", "Next word list"]
		},
	JA: {
		Config: ["設定 S", "設定画面に進みます。"],
		Record: ["録音", "声を録音します。録音されるのは4秒間です。録音中“録音ライト”が表示されます。"],
		Play: ["再生", "録音した声を再生します。"],
		Example: ["発音例", "発音例を再生します。"],
		Previous: ["戻る", "一つ前の単語に戻ります。"],
		Next: ["次へ", "次の単語に進みます。"],
		WordlistCaption: ["単語表", "単語表を変更します。"],
		SelectWords: ["単語の選択", "練習で使う単語を選択します"],
		WordlistUp: ["戻る", "一つ前の単語表に戻ります。"],
		WordlistDown: ["次へ", "次の単語表に進みます。"]
		},
	DE: {
		Config: ["Einstellungen", "Zur Seite 'Einstellungen'"],
		Record: ["Aufnahme", "Machen Sie eine Sprachaufnahme. Sie haben 4 Sekunden bevor die Aufnahme beginnt; achten Sie auf das rote Licht."],
		Play: ["Wiedergabe", "Abspielen der Aufnahme"],
		Example: ["Vorbild", "Vorbild abspielen"],
		Previous: ["Zurück", "zum vorigen Abschnitt"],
		Next: ["Voraus", "zum nächsten Abschnitt"],
		WordlistCaption: ["Wordliste", "Ändere Wordliste"],
		SelectWords: ["Wörter", "Wähle die Wörter zum üben"],
		WordlistUp: ["vorige", "Zur voriger Liste"],
		WordlistDown: ["nächste", "Zur nächster Liste"]
		},
	NL: {
		Config: ["Instellingen", "Ga naar de pagina met instellingen"],
		Record: ["Opnemen", 'Neem je uitspraak op. Je hebt 4 seconden, let op het rode "lampje"'],
		Play: ["Afspelen", "Speel je opgenomen uitspraak af"],
		Example: ["Voorbeeld", "Speel een voorbeeld van deze toon af"],
		Previous: ["Terug", "Vorige woord"],
		Next: ["Vooruit", "Volgende woord"],
		WordlistCaption: ["Woordenlijst", "Andere woordenlijst"],
		SelectWords: ["Woorden", "Kies de woorden om te oefenen"],
		WordlistUp: ["Vorige", "Vorige woordenlijst"],
		WordlistDown: ["Volgende", "Volgende woordenlijst"]
	}
};

var config_tables = {
	ZH: {
		Wordlists: ["单词表", "单词表"],
		WordlistCaption: ["单词表", "更换单词表。"],
		SelectWords: ["选择单词", "选择要练习的单词"],
		WordlistUp: ["上一个", "切换到上一个单词表。"],
		WordlistDown: ["下一个", "切换到下一个单词表。"],
		ShuffleLists: ["随机播放", "随机打乱单词表中的词，否则按顺序播放。"],
		AdaptiveLists: ["适应性", "只练习有难度的词，即发音错误两次以上的单词。"],
		UseSoundExample: ["实际发音", "如果提供了真人发音，选择此按键后，则播放真人发音，否则播放合成发音。"],
		Synthesis_eSpeak: ["合成音", "使用合成发音（需要eSpeak:www.espeak.org）。"],
		Voice: ["音质> ---", "选择合成音的种类"],
		Recognition: ["汉语水平", "可设置为高级汉语水平或母语者水平。"],
		StrictPost: ["水平", "进行审查发音时所使用的严格度（水平0-3）。水平最高时对发音的要求会非常严格。"],
		RecordingTimePost: ["（秒）", "录音时间（秒）"],
		OpenWordlist: ["打开单词表+", "选择并打开单词表"],
		DeleteWordlist: ["删除单词表 D", "删除单词表，需要按下'y'键确认"],
		DeleteWordlistConfirm: ["确认 y/N", "确定要删除吗？按下“y”键确定。"],
		},
	EN: {
		Wordlists: ["Word lists", "Word lists"],
		WordlistCaption: ["Word List", "Change word list"],
		SelectWords: ["Words", "Select words to practise"],
		WordlistUp: ["Previous", "Previous word list"],
		WordlistDown: ["Next", "Next word list"],
		ShuffleLists: ["Shuffle", "Shuffle words in word lists (on) or use a fixed order (off)"],
		AdaptiveLists: ["Adaptive", "Practice only words that required more than two attempts"],
		UseSoundExample: ["Real example", "Use a real sound recording (on) if available or synthesized tones (off) as examples"],
		Synthesis_eSpeak: ["Synthesis", "Use a synthetic voice as example (you need eSpeak: www.espeak.org)"],
		Voice: ["Voice> ---", "Select a synthetic voice"],
		Recognition: ["Proficiency", "Set to recognize advanced or native speakers"],
		StrictPost: ["Level", "How strict tone pronunciation will be checked (Level 0-3). The highest level is quite strict."],	
		RecordingTimePost: ["(sec)", "Time of recording in seconds"],
		OpenWordlist: ["Open List+", "Select and read a single wordlist "],
		DeleteWordlist: ["Delete List", "Permanently delete the word list. You have to confirm this by typing 'y'"],
		DeleteWordlistConfirm: ["Realy y/N", "Are you sure you want to proceed? Confirm this option by typing 'y'"],
		},
			
	JA: {
		Wordlists: ["単語表", "単語表"],
		WordlistCaption: ["単語表", "単語表を変更します。"],
		SelectWords: ["単語の選択", "練習で使う単語を選択します"],
		WordlistUp: ["戻る", "一つ前の単語表に戻ります。"],
		WordlistDown: ["次へ", "次の単語表に進みます。"],
		ShuffleLists: ["シャッフル", "オンにすると単語表はシャッフルされ、オフなら元の順序が維持されます。"],
		AdaptiveLists: ["順応モード", "二回以内で合格できなかった単語だけ表示されるようになります。"],
		UseSoundExample: ["実音声", "オンでかつ実音声が用意されていれば実音声を例として使用し、そうでないなら合成音声を使用します。"],
		Synthesis_eSpeak: ["合成音声", "合成音声を例として使用します（eSpeakが必要です：www.espeak.org）。"],
		Voice: ["声質> ---", "合成音声の声質を選択"],
		Recognition: ["中国語レベル", "上級者や母語者レベルに設定できます。"],
		StrictPost: ["レベル", "発音チェックの厳しさを設定します（レベル0-3）。最高レベルでは非常に厳しい基準でチェックされます。"],	
		RecordingTimePost: ["（秒）", "録音時間の秒数"],
		OpenWordlist: ["単語表読み込み+", "単語表を選択し読み込みます"],
		DeleteWordlist: ["単語表削除", "単語表を消去します。“y”キーを押して確定して下さい"],
		DeleteWordlistConfirm: ["削除確認 y/N", "本当に削除しますか？“y”キーで確定します。"],
		},
		
	DE: {
		Wordlists: ["Wortlisten", "Wortlisten"],
		WordlistCaption: ["Wordliste", "Ändere Wordliste"],
		SelectWords: ["Wörter", "Wähle die Wörter zum üben"],
		WordlistUp: ["vorige", "Zur voriger Liste"],
		WordlistDown: ["nächste", "Zur nächster Liste"],
		ShuffleLists: ["Shuffle", "Shuffle Wörter in Wortlisten (ein) oder eine feste Reihenvolge (aus)"],
		AdaptiveLists: ["Adaptiv", "Üben Sie nur Wörter die mehr als zwei Versuchen erforderten"],
		UseSoundExample: ["Audio Vorbild", "Gebrauche echte Aufnahmen zum Vorbild wenn anwesend (ein) oder synthetische Töne (aus)"],
		Synthesis_eSpeak: ["Synthese", "Gebrauche eine synthetische Stimme zum Vorbild (Sie brauchen eSpeak: www.espeak.org)"],
		Voice: ["Stimme> ---", "Wähle eine synthetische Stimme"],
		Recognition: ["Sprachkenntnisse", "Einstellung für fortgeschrittene Studenten"],
		StrictPost: ["Stufe", "Wie preziese die Aussprache der Töne geprüft wird (Stufe 0-3). Die högste Stufe fordert eine preciese Aussprage"],
		RecordingTimePost: ["(sec)", "Aufnahmezeit in Secunden"],
		OpenWordlist: ["Öfne Liste+", "Wähle und öfne eine einzige Wortliste"],
		DeleteWordlist: ["Lössche Liste", "Lössche die Wortliste. Sie müssen die 'j' taste drücken um das Lösschen zu bestätigen."],
		DeleteWordlistConfirm: ["Sicher? j/N", "Sind Sie sicher? Bestätige diese Aktion mit der taste 'j'"],
		},		
	NL: {
		Wordlists: ["Woordenlijsten", "Woordenlijsten"],
		WordlistCaption: ["Woordenlijst", "Andere woordenlijst"],
		SelectWords: ["Woorden", "Kies de woorden om te oefenen"],
		WordlistUp: ["Vorige", "Vorige woordenlijst"],
		WordlistDown: ["Volgende", "Volgende woordenlijst"],
		ShuffleLists: ["Woorden mixen", "Gebruik elke keer een andere volgorde van de woorden"],
		AdaptiveLists: ["Adaptief", "Oefen alleen woorden waarvoor meer dan twee pogingen nodig waren"],
		UseSoundExample: ["Spraakvoorbeeld", "Laat echte spraakopnamen (aan) of kunstmatige tonen (uit) horen als voorbeeld"],
		Synthesis_eSpeak: ["Synthese", "Gebruik een synthetische stem als voorbeeld (eSpeak is hiervoor nodig: www.espeak.org)"],
		Voice: ["Stem> ---", "Kies een synthetische stem"],
		Recognition: ["Taalniveau", "Stel de herkenner in op gevorderde of moedertaal sprekers"],
		StrictPost:	["Niveau", "Hoe strikt de uitspraak van de tonen gecontroleerd wordt (Niveau 0-3). Het hoogste niveau is strikt."],
		RecordingTimePost: ["(sec)", "Opnametijd in seconden"],
		OpenWordlist: ["Open Lijst+", "Selecteer en lees een enkele woordlijst"],
		DeleteWordlist: ["Verwijder Lijst", "Verwijder de getoonde woordlijst permanent, u moet dit bevestigen door een 'j' te typen"],
		DeleteWordlistConfirm: ["Heel zeker j/N", "Bent u zeker dat u door wilt gaan? Bevestig door een 'j' te typen"],
		}
};


function getRegister () {
	var index = document.getElementById("Register").selectedIndex;
	var value = document.getElementById("Register").options[index].value;
	if (index <= 0) value = 249;
	return value;
}

function setRegister (value) {
	for(var x = 0; x < document.getElementById("Register").options.length; ++ x) {
		if (document.getElementById("Register").options[x].value == value) {
			document.getElementById("Register").selectedIndex = x;
		};
	};
};

var selector_tables = {
	ZH: {
		Language: ["语言", "选择页面的显示语言。"],
		Register:	["您的声音", "设置您的声音类型。"],
		Register_350:	["女性 高 W", "如果发音人为女性且声音较高，那么选择此项。"],
		Register_300:	["女性 中 i", "如果发音人为女性且声音高度适中，那么选择此项。"],
		Register_250:	["女性 低 o", "如果发音人为女性且声音较低，那么选择此项。"],
		Register_249:	["男性 高 M", "如果发音人为男性且声音较高，那么选择此项。"],
		Register_180:	["男性 中 a", "如果发音人为男性且声音高度适中，那么选择此项。"],
		Register_150:	["男性 低 L", "如果发音人为男性且声音较低，那么选择此项。"],
		Register_125:	["男性 超低", "如果发音人为男性且声音很低，那么选择此项。"],
		Strict: ["水平", "进行审查发音时所使用的严格度（水平0-3）。水平最高时对发音的要求会非常严格。"],
		RecordingTime: ["记录", "录音时间（秒）"],
		},
	EN: {
		Language: ["Language", "Select a language"],
		Register: ["Your Voice", "Select the category that fits your voice"],
		Register_350: ["Woman High", "Pick this if you are a female with a high voice"],
		Register_300: ["Woman Mid", "Pick this if you are a female with a mid-range voice"],
		Register_250: ["Woman Low", "Pick this if you are a female with a low voice"],
		Register_249: ["Man High", "Pick this if you are a male with a high voice"],
		Register_180: ["Man Mid", "Pick this if you are a male with a mid-range voice"],
		Register_150: ["Man Low", "Pick this if you are a male with a low voice"],
		Register_125: ["Man Xtr Low", "Pick this if you are a male with a very low voice"],
		Strict: ["Level", "How strict tone pronunciation will be checked (Level 0-3). The highest level is quite strict."],	
		RecordingTime: ["Recording", "Time of recording in seconds"],
		},
	JA: {
		Language: ["言語", "表示言語を設定します。"],
		Register:	["発話者の声", "発話者の声のカテゴリーを設定します。"],
		Register_350:	["女性　高め W", "発話者が女性でかつ声が高めのとき選択します。"],
		Register_300:	["女性　中間 i", "発話者が女性でかつ声が中間の高さのとき選択します。"],
		Register_250:	["女性　低め o", "発話者が女性でかつ声が低めのとき選択します。"],
		Register_249:	["男性　高め M", "発話者が男性でかつ声が高めのとき選択します。"],
		Register_180:	["男性　中間 a", "発話者が男性でかつ声が中間の高さのとき選択します。"],
		Register_150:	["男性　低め L", "発話者が男性でかつ声が低めのとき選択します。"],
		Register_125:	["男性　更に低め", "発話者が男性でかつ声が更に低めのとき選択します。"],
		Strict: ["レベル", "発音チェックの厳しさを設定します（レベル0-3）。最高レベルでは非常に厳しい基準でチェックされます。"],	
		RecordingTime: ["録音", "録音時間の秒数"],
		},
	DE: {
		Language: ["Sprache", "Wähle die gewünschte Sprache"],
		Register:	["Ihre Stimme", "Wähle die Category die past bei Ihrer Stimme"],
		Register_350:	["Frau hoch", "Wähle diesen Knopf wenn Sie eine Frau mit eine hohe Stimme sind"],
		Register_300:	["Frau mittel", "Wähle diesen Knopf wenn Sie eine Frau mit eine mittel-hohe Stimme sind"],
		Register_250:	["Frau tief", "Wähle diesen Knopf wenn Sie eine Frau mit eine tiefe Stimme sind"],
		Register_249:	["Man hoch", "Wähle diesen Knopf wenn Sie ein Mann mit eine hohe Stimme sind"],
		Register_180:	["Man mittel", "Wähle diesen Knopf wenn Sie ein Mann mit eine mittle-hohe Stimme sind"],
		Register_150:	["Man tief", "Wähle diesen Knopf wenn Sie ein Mann mit eine tiefe Stimme sind"],
		Register_125:	["Man Xtr tief", "Wähle diesen Knopf  wenn Sie ein Mann mit eine sehr tiefe Stimme sind"],
		Strict: ["Stufe", "Wie preziese die Aussprache der Töne geprüft wird (Stufe 0-3). Die högste Stufe fordert eine preciese Aussprage"],
		RecordingTime: ["Aufnahme", "Aufnahmezeit in Secunden"],
		},
	NL: {
		Language: ["Taal", "Selecteer de gewenste taal"],
		Register:	["Uw Stem", "Kies de categorie die past bij uw stem"],
		Register_350:	["Vrouw Hoog", "Kies dit als u een vrouw bent met een hoge stem"],
		Register_300:	["Vrouw Mid", "Kies dit als u een vrouw bent met een middel-hoge stem"],
		Register_250:	["Vrouw Laag", "Kies dit als u een vrouw bent met een lage stem"],
		Register_249:	["Man Hoog", "Kies dit als u een man bent met een hoge stem"],
		Register_180:	["Man Mid", "Kies dit als u een man bent met een middel-lage stem"],
		Register_150:	["Man Laag", "Kies dit als u een man bent met een lage stem"],
		Register_125:	["Man Xtr Laag", "Kies dit als u een man bent met een zeer lage stem"],
		Strict:	["Niveau", "Hoe strikt de uitspraak van de tonen gecontroleerd wordt (Niveau 0-3). Het hoogste niveau is strikt."],
		RecordingTime: ["Opname", "Opnametijd in seconden"],
		},
}

var language_table = {
	Language_ZH: ["汉语", "汉语版"],
	Language_EN: ["English", "English language version"],
	Language_JA: ["日本語", "日本語版"],
	Language_DE: ["Deutsch", "Deutsche Version"],	
	Language_NL: ["Nederlands", "Gebruik Nederlands"]	
}

if(!mainpage_tables[userLanguage]) {
	userLanguage = undefined;
};


var feedback_tables = {
	ZH: {
		Cancel: "取消",
		Continue: "继续",
		Next: ">",
		Previous: "<",
		Apply: "应用•",
		Clear: "清空",
		All: "全部",
		Show: "显示单词",
		Part: "部分",
		Tones: "声调",
		InstallUnzip: "只有安装了7-zip（7-zip.org）软件后，才可以读出zip压缩形式的.sgc文件。",
		AddWordlist: "导入单词表",
		SelectWordlist: "单词表",
		},
	EN: {
		Cancel: "Cancel",
		Continue: "Continue",
		Next: ">",
		Previous: "<",
		Apply: "Apply•",
		Clear: "Clear",
		All: "All",
		Show: "Show word",
		Part: "Part",
		Tones: "Tones",
		InstallUnzip: "Files with .sgc en .zip extensions can only be read when you have installed the 7-Zip application (7-zip.org)",
		AddWordlist: "Add words from wordlist",
		SelectWordlist: "Switch to other wordlist",
		},
	JA: {
		Cancel: "取り消し",
		Continue: "継続",
		Next: ">",
		Previous: "<",
		Apply: "適用•",
		Clear: "クリア",
		All: "全部",
		Show: "単語を表示",
		Part: "部分",
		Tones: "声調",
		InstallUnzip: "zipで圧縮されている.sgc形式のファイルは7-zip（7-zip.org）がインストールされているときにだけ読み込みことができます。",
		AddWordlist: "単語表から単語を追加します",
		SelectWordlist: "単語表",
		},
	DE: {
		Cancel: "Zurück",
		Continue: "Weiter",
		Next: ">",
		Previous: "<",
		Apply: "Anwenden•",
		Clear: "Löschen",
		All: "Alles",
		Show: "Zeige Wort",
		Part: "Teil",
		Tones: "Töne",
		InstallUnzip: "Dateien mit der .sgc und .zip Erweiterung können nur gebraucht werden wenn sie das 7-Zip Programm installiert haben (7-zip.org)",
		AddWordlist: "Wörter aus Wortliste hinzufügen",
		SelectWordlist: "Wähle andere Wortliste",
		},
	NL: {
		Cancel: "Terug",
		Continue: "Verder",
		Next: ">",
		Previous: "<",
		Apply: "Toepassen•",
		Clear: "Wissen",
		All: "Alles",
		Show: "Woord laten zien",
		Part: "Onderdeel",
		Tones: "Tonen",
		InstallUnzip: "Files met .sgc en .zip kunt u alleen lezen als u de 7-Zip applicatie geinstalleerd hebt (7-zip.org)",
		AddWordlist: "Woorden uit woordenlijst toevoegen",
		SelectWordlist: "Ga naar andere woordenlijst",
	},
};

/*
 * GENERAL FUNCTIONS 
 * 
 */
 
// Read from CSV URL/File.
// This should handel processing in handleData!!!
var csvDelimiter = ';';
function readDelimitedTextFile (file, handleData, delimiter)
{
	var url = file.name ? window.URL.createObjectURL(file) : file;
		
	var rawFile = new XMLHttpRequest();
	rawFile.open("GET", url, true);
	rawFile.onreadystatechange = function ()
	{
		if(rawFile.readyState === 4)
		{
			if(rawFile.status === 200 || rawFile.status == 0)
			{
				var allText = rawFile.responseText;
				handleData(file, allText, delimiter);
			}
		}
	}
	rawFile.send(null);
}

function processCSV (file, allText, delimiter) {
	var del = delimiter? delimiter : csvDelimiter;
	var allTextLines = allText.split(/\r\n|\n/);
	var lines = [];
	for (var i=0; i<allTextLines.length; i++) {
		// Skip comments and empty lines
		if (! allTextLines[i].match(/^\s*#/) && allTextLines[i].match(/[\w]/)) {
			var data = allTextLines[i].split(del);
			var tarr = [];
			for (var j=0; j<data.length; j++) {
				tarr.push(data[j]);
			}
		lines.push(tarr);
		};
	}
	return lines;
}

// Read and write tab-separated-values tables
function readCSV (file) {
	var delimiter = csvDelimiter;
	if (file.name.match(/\.(tsv|Table)\s*$/i)) {
		delimiter = "\t";
	};
	readDelimitedTextFile(file, processCSV, delimiter);
};

