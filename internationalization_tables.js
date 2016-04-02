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

function set_language (language) {
	var labels = internationalization_tables[language];
	for(x in labels) {
		if(document.getElementById(x)) {
			document.getElementById(x).textContent = labels[x][0];
			document.getElementById(x).parentNode.parentNode.title = labels[x][1];
		};
	};
	
	labels = register_tables[language];
	for(x in labels) {
		if(document.getElementById(x)) {
			document.getElementById(x).title = labels[x][1];
			var defaultText = document.getElementById(x+"Caption");
			defaultText.textContent = labels[x][0]
		} else if (x.match(/_/)) {
			var Id = x.replace(/_[^_]*$/, "");
			var value = x.replace(/^[^_]*_/, "");
			if(document.getElementById(Id)) {
				var selector = document.getElementById(Id);
				var newOption = selector.options[0].cloneNode(true);
				newOption.value = value;
				newOption.text = labels[x][0];
				selector.add(newOption);
			};
		};
	};
};

var internationalization_tables = {
	ZH: {
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

var register_tables = {
	ZH: {
		Register: ["Your Voice", "Select the category that fits your voice"],
		Register_350: ["Woman High", "Pick this if you are a female with a high voice"],
		Register_300: ["Woman Mid", "Pick this if you are a female with a mid-range voice"],
		Register_250: ["Woman Low", "Pick this if you are a female with a low voice"],
		Register_249: ["Man High", "Pick this if you are a male with a high voice"],
		Register_180: ["Man Mid", "Pick this if you are a male with a mid-range voice"],
		Register_150: ["Man Low", "Pick this if you are a male with a low voice"],
		Register_125: ["Man Xtr Low", "Pick this if you are a male with a very low voice"]
		},
	EN: {
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
		Register: ["Your Voice", "Select the category that fits your voice"],
		Register_350: ["Woman High", "Pick this if you are a female with a high voice"],
		Register_300: ["Woman Mid", "Pick this if you are a female with a mid-range voice"],
		Register_250: ["Woman Low", "Pick this if you are a female with a low voice"],
		Register_249: ["Man High", "Pick this if you are a male with a high voice"],
		Register_180: ["Man Mid", "Pick this if you are a male with a mid-range voice"],
		Register_150: ["Man Low", "Pick this if you are a male with a low voice"],
		Register_125: ["Man Xtr Low", "Pick this if you are a male with a very low voice"]
		},
	DE: {
		Register: ["Your Voice", "Select the category that fits your voice"],
		Register_350: ["Woman High", "Pick this if you are a female with a high voice"],
		Register_300: ["Woman Mid", "Pick this if you are a female with a mid-range voice"],
		Register_250: ["Woman Low", "Pick this if you are a female with a low voice"],
		Register_249: ["Man High", "Pick this if you are a male with a high voice"],
		Register_180: ["Man Mid", "Pick this if you are a male with a mid-range voice"],
		Register_150: ["Man Low", "Pick this if you are a male with a low voice"],
		Register_125: ["Man Xtr Low", "Pick this if you are a male with a very low voice"]
		},
	NL: {
		Register: ["Your Voice", "Select the category that fits your voice"],
		Register_350: ["Woman High", "Pick this if you are a female with a high voice"],
		Register_300: ["Woman Mid", "Pick this if you are a female with a mid-range voice"],
		Register_250: ["Woman Low", "Pick this if you are a female with a low voice"],
		Register_249: ["Man High", "Pick this if you are a male with a high voice"],
		Register_180: ["Man Mid", "Pick this if you are a male with a mid-range voice"],
		Register_150: ["Man Low", "Pick this if you are a male with a low voice"],
		Register_125: ["Man Xtr Low", "Pick this if you are a male with a very low voice"]
		},
}

if(!internationalization_tables[userLanguage]) {
	userLanguage = undefined;
};
