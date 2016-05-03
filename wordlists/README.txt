Place SpeakGoodfChinese wordlists here. 

How to create word lists

To load, or read, a new word list go to the Settings page and click on 
the Open List button. You can then select the file that contains the 
word list. It will automatically open and be stored in your local word 
list directory.

Very simple word lists

The easiest and simplest way to create a word list is to create a pure 
text file (.txt, or DOS file). The file should have the name of the 
word list and the extention should be .txt. Each line should countain a 
single pinyin word.

Example: SGC2example1.txt
chi1
ta1
jin1tian1
can1ting1
huan1ying2
zhong1guo2
duo1shao3
zhi3you3

Simple word lists with characters and translations

Characters and translations can be added to the simple, text based word 
list descibed above. Again, create a pure text (.txt, or DOS file) file 
with the .txt extention. Each line should start with a pinyin word. 
Next, follow the pinyin by a tab or ';' character and the characters 
that correspond to the pinyin, again a tab or ';' character and the 
translation in free text. Translations can be in any language. For 
instance, 吃 can be entered as to eat, कालो, 食べる, ჭამა or any other 
transcription in UTF8.

Example: SGC2example2.txt
chi1;吃;to eat
ta1;他;he, she, it
jin1tian1;今天;today
can1ting1;餐厅;restaurant
huan1ying2;欢迎;to welcome
zhong1guo2;中国;China
duo1shao3;多少;how many
zhi3you3;只有;only

Audio files can be added in the same manner. Just add an item with the 
extention of an audio file to the line (between tabs or ';' 
characters). For instance, chi1.mp3 will be interpreted as an audio 
example.

These simple word lists do not contain information about the order and 
nature of the items. There can be errors in distinguishing characters, 
translations, and audio examples.

Word list tables

Simple word lists based on text files can lead to errors in the values 
of the items. Large lists with both characters and translations should 
be constructed as tab-separated-values (tsv) tables. These can be 
exported (Save as) from a spreadsheet or database program. The file 
extention of such a file should be .Table or .tsv.

A SpeakGoodChinese wordlist table is a tab-separated-values table that 
starts with a header line which contains the column headers Pinyin, 
Character, Sound, Translation. Then the column values are written on a 
line with tabs separating them.

Example: SGC2example3.tsv
Pinyin	Character	Sound	Translation
chi1	吃	-	to eat
ta1	他	-	he, she, it
jin1tian1	今天	-	today
can1ting1	餐厅	-	restaurant
huan1ying2	欢迎	-	to welcome
zhong1guo2	中国	-	China
duo1shao3	多少	-	how many
zhi3you3	只有	-	only

Word lists with associated audio files

These word list distributions are simple flat ZIP files with the name 
<list name>.sgc. They contain a list of all the words in pinyin with 
the name wordlist.txt or wordlist.Table as is discussed above. Except 
that the name of the word list file should be either wordlist.txt or 
wordlist.Table. Other names are not allowed. The sound files should be 
named <pinyin word>.ext, where <pinyin word> is the pinyin 
transcription, eg, sheng1zi4, and ext the sound extension type (eg, 
wav). Note that SpeakGoodChinese uses Praat to process the sound files. 
So only those sound files recognized by Praat can be used (see Praat: 
Read from file...). SpeakGoodChinese will use WAV (.wav), Flac (.flac), 
MP3 (.mp3), and Speex (.spx) files as examples if they are present . 
Don't forget to include a LICENSE.txt file with the copyright and 
licensing information. If you use one of the Creative Commons licenses 
or the GNU GPL, we might be willing to put your list on our web-site.

It is possible to use SpeakGoodChinese to record example audio files 
for wordlists and student evaluation. On the Settings page, press the 
Save Audio button and select a folder to store the recordings. A blue 
dot will be displayed in the lower right corner of the Main page as 
long as recordigns are stored. While the blue dot is visible on the 
Main page, all audio is stored! The recorded files have file-names 
constructed of the pinyin spelling of the word and the extention .wav. 
Every recording will overwrite existing recordings of the same pinyin 
word. The storage of recordings can be terminated by pressing the Save 
Audio button again. Select those recordings you consider good enough as 
examples and copy them to the target wordlist directory for inclusion 
in the distribution. When available, SpeakGoodChinese will display the 
stored recordings for evaluation until a new one is recorded.

Word lists with "real" Pinyin (builds from 2015-06-10)

It is often inconvennient to compile lists using a number scheme for 
pinyin. SGC2 will recognize standard UTF8 pinyin.
Example:
Pinyin	Character	Sound	Translation	Lesson
chī	吃	-	to eat	1
zhǐ​yǒu	只有	-	only	2

However, in this type of pinyin, the syllable boundaries can be 
ambiguous, as in the combination "nán​gōng" or "xīngān". To prevent 
errors in SGC2, place a '-quote at the boundary, e.g., "Xīng'ān".

Word selection and Lessons

Students can select the words to practise on the Main page. Click the 
Words button on the right between the buttons to navigate the word 
lists. A form with a list of all the words currently available will be 
displayed. Students can add words from other word lists or by hand. 
They can select words based on tones and the lesson Part. The wordlist 
table can contain a collumn with the label Lesson and a lesson number 
for each line. The words are sorted and displayed with lesson numbers 
in the word selection window. The student can select the lessons to 
study when starting.

Example: SGC2example4.tsv
Pinyin	Character	Sound	Translation	Lesson
chi1	吃	-	to eat	1
ta1	他	-	he, she, it	1
jin1tian1	今天	-	today	1
can1ting1	餐厅	-	restaurant	1
huan1ying2	欢迎	-	to welcome	1
zhong1guo2	中国	-	China	2
duo1shao3	多少	-	how many	2
zhi3you3	只有	-	only	2

The entries in the Lesson column do not have to be numbers. Any string 
is allowed, Lesson 2, पाठ 2, レッスン2 and 第二课 are all valid lesson labels.
