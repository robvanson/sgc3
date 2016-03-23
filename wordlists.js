var currentWordlist = [];
function get_wordlist (wordlistName) {
	var wordlistNum;
	for(wordlistNum = 0; wordlists[wordlistNum][0] != wordlistName; wordlistNum++) { };
	currentWordlist = wordlists[wordlistNum][1];
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

var wordlists = [
		[	
		"20 basic tone combinations", [
			["yi1sheng1", "医生", "doctor"],
			["zhong1guo2", "中国", "China"],
			["zhong1wu3", "中午", "noon"],
			["zhi1dao4", "知道", "to know"],
			["ma1ma", "妈妈", "mother"],
			["xue2sheng1", "学生", "student"],
			["chang2chang2", "常常", "often"],
			["peng2you3", "朋友", "friend"],
			["bu2shi4", "不是", "be not"],
			["shen2me", "什么", "what"],
			["lao3shi1", "老师", "teacher"],
			["mei3guo2", "美国", "USA"],
			["ni3hao3", "你好", "hello!"],
			["qing3wen4", "请问", "May I ask..?"],
			["dong3le", "懂了", "understood"],
			["da4jia1", "大家", "everyone"],
			["da4xue2", "大学", "university"],
			["tiao4wu3", "跳舞", "to dance"],
			["zai4jian4", "再见", "Good bye!"],
			["xie4xie", "谢谢", "Thanks!"]
			]
		],
		[
		"An example wordlist", [
			["chi1", "吃", "to eat"],
			["ta1", "他,她,它", "he, she, it"],
			["jin1tian1", "今天", "today"],
			["can1ting1", "餐厅", "restaurant"],
			["huan1ying2", "欢迎", "to welcome"],
			["zhong1guo2", "中国", "China"],
			["duo1shao3", "多少", "how many"],
			["zhi3you3", "只有", "only"],
			["sheng1ri4", "生日", "birthday"],
			["gao1xing4", "高兴", "happy"],
			["ma1ma0", "妈妈", "mama"],
			["ge1ge0", "哥哥", "older brother"],
			["ren2", "人", "person"],
			["qian2", "前", "front"],
			["shi2jian1", "时间", "time"],
			["jie2hun1", "结婚", "to marry"],
			["chang2cheng2", "长城", "the Great Wall"],
			["xue2xi2", "学习", "to study"],
			["mei2you3", "没有", "haven't"],
			["you2yong3", "游泳", "to swim"],
			["fo2jiao4", "佛教", "Buddhism"],
			["hai2shi4", "还是", "or"],
			["shen2me0", "什么", "what"],
			["peng2you0", "朋友", "friend"],
			["wo3", "我", "I, me"],
			["xiang3", "享", "to enjoy"],
			["xiang3", "想", "to think"],
			["xi3huan0", "喜欢", "to like"],
			["yi3jing1", "已经", "already"],
			["lv3xing2", "旅行", "to travel"],
			["qi3chuang2", "起床", "to get up"],
			["ni3hao3", "你好", "hello"],
			["mei3li4", "美丽", "beautiful"],
			["nv3shi4", "女士", "lady"],
			["xiao3jie3", "小姐", "miss"],
			["na3li3", "哪里", "where"],
			["yi1", "一", "one"],
			["er4", "二", "two"],
			["san1", "三", "three"],
			["si4", "四", "four"],
			["wu3", "五", "five"],
			["liu4", "六", "six"],
			["qi1", "七", "seven"],
			["ba1", "八", "eight"],
			["jiu3", "九", "nine"],
			["shi2", "十", "ten"],
			["bai3", "百", "hundred"],
			["qian1", "千", "thousand"],
			["shi4", "是", "is"],
			["tui4xiu1", "退休", "retirement"],
			["hou4tian1", "后天", "day after tomorrow"],
			["shang4xue2", "上学", "to attend school"],
			["ji4jie2", "季节", "season"],
			["zi4ji3", "自己", "self"],
			["xia4wu3", "下午", "afternoon"],
			["dian4hua4", "电话", "telephone"],
			["zai4jian4", "再见", "goodbye"],
			["xie4xie0", "谢谢", "thanks"],
			["mei4mei0", "妹妹", "younger sister"],
			["re4ma0", "热吗", "is it hot? (吗: yes/no question particle)"],
			["ni3ne0", "你呢", "how about you? (呢: question particle)"],
			["re4", "热", "hot"]
			]
		]
	]
