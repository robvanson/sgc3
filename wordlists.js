var currentWordlist = [];
var wordlistNumber;
function get_wordlist (wordlistName) {
	var wordlistNum;
	for(wordlistNum = 0; wordlists[wordlistNum][0] != wordlistName; wordlistNum++) { };
	currentWordlist = wordlists[wordlistNum][1];
	wordlistNumber = wordlistNum;
};

function add_wordlist_names_to_select () {
	var selector = document.getElementById('SelectWordlist');
	var i = 0;
	for(i=0; i < wordlists.length; ++i) {
		var lastOption = selector.options.length - 1;
		var wordlistTitle = wordlists[i][0];
		var newOption = selector.options[0].cloneNode(true);
		newOption.value = wordlistTitle;
		newOption.text = wordlistTitle;
		selector.add(newOption);
	};
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

// convert numbers to tone marks
// http://www.lexilogos.com/keyboard/pinyin_conversion.htm

var wordlists = [
		[	
		"20 basic tone combinations", [
			["yi1sheng1", "yīshēng", "医生", "doctor"],
			["zhong1guo2", "zhōngguó", "中国", "China"],
			["zhong1wu3", "zhōngwǔ", "中午", "noon"],
			["zhi1dao4", "zhīdào", "知道", "to know"],
			["ma1ma", "māma", "妈妈", "mother"],
			["xue2sheng1", "xuéshēng", "学生", "student"],
			["chang2chang2", "chángcháng", "常常", "often"],
			["peng2you3", "péngyǒu", "朋友", "friend"],
			["bu2shi4", "búshì", "不是", "be not"],
			["shen2me", "shénme", "什么", "what"],
			["lao3shi1", "lǎoshī", "老师", "teacher"],
			["mei3guo2", "měiguó", "美国", "USA"],
			["ni3hao3", "nǐhǎo", "你好", "hello!"],
			["qing3wen4", "qǐngwèn", "请问", "May I ask..?"],
			["dong3le", "dǒngle", "懂了", "understood"],
			["da4jia1", "dàjiā", "大家", "everyone"],
			["da4xue2", "dàxué", "大学", "university"],
			["tiao4wu3", "tiàowǔ", "跳舞", "to dance"],
			["zai4jian4", "zàijiàn", "再见", "Good bye!"],
			["xie4xie", "xièxie", "谢谢", "Thanks!"]
			]                
		],                   
		[                    
		"An example wordlist", [
			["chi1", "chī", "吃", "to eat"],
			["ta1", "tā", "他,她,它", "he, she, it"],
			["jin1tian1", "jīntiān", "今天", "today"],
			["can1ting1", "cāntīng", "餐厅", "restaurant"],
			["huan1ying2", "huānyíng", "欢迎", "to welcome"],
			["zhong1guo2", "zhōngguó", "中国", "China"],
			["duo1shao3", "duōshǎo", "多少", "how many"],
			["zhi3you3", "zhǐyǒu", "只有", "only"],
			["sheng1ri4", "shēngrì", "生日", "birthday"],
			["gao1xing4", "gāoxìng", "高兴", "happy"],
			["ma1ma0", "māma", "妈妈", "mama"],
			["ge1ge0", "gēge", "哥哥", "older brother"],
			["ren2", "rén", "人", "person"],
			["qian2", "qián", "前", "front"],
			["shi2jian1", "shíjiān", "时间", "time"],
			["jie2hun1", "jiéhūn", "结婚", "to marry"],
			["chang2cheng2", "chángchéng", "长城", "the Great Wall"],
			["xue2xi2", "xuéxí", "学习", "to study"],
			["mei2you3", "méiyǒu", "没有", "haven't"],
			["you2yong3", "yóuyǒng", "游泳", "to swim"],
			["fo2jiao4", "fójiào", "佛教", "Buddhism"],
			["hai2shi4", "háishì", "还是", "or"],
			["shen2me0", "shénme", "什么", "what"],
			["peng2you0", "péngyou", "朋友", "friend"],
			["wo3", "wǒ", "我", "I, me"],
			["xiang3", "xiǎng", "享", "to enjoy"],
			["xiang3", "xiǎng", "想", "to think"],
			["xi3huan0", "xǐhuan", "喜欢", "to like"],
			["yi3jing1", "yǐjīng", "已经", "already"],
			["lv3xing2", "lǚxíng", "旅行", "to travel"],
			["qi3chuang2", "qǐchuáng", "起床", "to get up"],
			["ni3hao3", "nǐhǎo", "你好", "hello"],
			["mei3li4", "měilì", "美丽", "beautiful"],
			["nv3shi4", "nǚshì", "女士", "lady"],
			["xiao3jie3", "xiǎojiě", "小姐", "miss"],
			["na3li3", "nǎlǐ", "哪里", "where"],
			["yi1", "yī", "一", "one"],
			["er4", "èr", "二", "two"],
			["san1", "sān", "三", "three"],
			["si4", "sì", "四", "four"],
			["wu3", "wǔ", "五", "five"],
			["liu4", "liù", "六", "six"],
			["qi1", "qī", "七", "seven"],
			["ba1", "bā", "八", "eight"],
			["jiu3", "jiǔ", "九", "nine"],
			["shi2", "shí", "十", "ten"],
			["bai3", "bǎi", "百", "hundred"],
			["qian1", "qiān", "千", "thousand"],
			["shi4", "shì", "是", "is"],
			["tui4xiu1", "tuìxiū", "退休", "retirement"],
			["hou4tian1", "hòutiān", "后天", "day after tomorrow"],
			["shang4xue2", "shàngxué", "上学", "to attend school"],
			["ji4jie2", "jìjié", "季节", "season"],
			["zi4ji3", "zìjǐ", "自己", "self"],
			["xia4wu3", "xiàwǔ", "下午", "afternoon"],
			["dian4hua4", "diànhuà", "电话", "telephone"],
			["zai4jian4", "zàijiàn", "再见", "goodbye"],
			["xie4xie0", "xièxie", "谢谢", "thanks"],
			["mei4mei0", "mèimei", "妹妹", "younger sister"],
			["re4ma0", "rèma", "热吗", "is it hot? (吗: yes/no question particle)"],
			["ni3ne0", "nǐne", "你呢", "how about you? (呢: question particle)"],
			["re4", "rè", "热", "hot"]
			]
		]
	]
