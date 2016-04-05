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

function set_language (language) {
	var labels = internationalization_tables[language];
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
	
	localStorage.language = language;
};

function change_language () {
	var index = document.getElementById("Language").selectedIndex;
	var value = document.getElementById("Language").options[index].value;
	userLanguage = value;
	set_language (userLanguage);
	return userLanguage;
};

var internationalization_tables = {
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
		Register_125:	["男性 超低", "如果发音人为男性且声音很低，那么选择此项。"]
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
		Register_125: ["Man Xtr Low", "Pick this if you are a male with a very low voice"]
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
		Register_125:	["男性　更に低め", "発話者が男性でかつ声が更に低めのとき選択します。"]
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
		Register_125:	["Man Xtr tief", "Wähle diesen Knopf  wenn Sie ein Mann mit eine sehr tiefe Stimme sind"]
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
		Register_125:	["Man Xtr Laag", "Kies dit als u een man bent met een zeer lage stem"]
		},
}

var language_table = {
	Language_ZH: ["汉语", "汉语版"],
	Language_EN: ["English", "English language version"],
	Language_JA: ["日本語", "日本語版"],
	Language_DE: ["Deutsch", "Deutsche Version"],	
	Language_NL: ["Nederlands", "Gebruik Nederlands"]	
}

if(!internationalization_tables[userLanguage]) {
	userLanguage = undefined;
};
