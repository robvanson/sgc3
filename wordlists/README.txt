How to create word lists

To load, or read, a new word list go to the Settings page and click on 
the Open List button. You can then select the file that contains the 
word list. It will automatically open and be stored in your local word 
list map.

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

Audio files can be added in the same manner. Just add an URL to an 
audio file to the line (between tabs or ';' characters). For instance, 
http://speakgoodchinese.org/articles/chi1.mp3 will be used as 
an audio example.

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

Wordlists can be combined with audio examples in zip archives with
an .sgc extension. These word list distributions are simple 
flat ZIP files with the name <list name>.sgc. They contain maps named
after the wordlist and a list of all the words in pinyin. This list must 
have the name wordlist.txt or wordlist.Table. 
Other names are not allowed. The audio files should be named <pinyin word>.ext, 
where <pinyin word> is the pinyin transcription, eg, sheng1zi4, 
and ext the sound extension type (eg, wav). Note that SpeakGoodChinese 
uses the web browser to process the audio files. So only those audio files 
recognized by the web browser can be used. Most web browsers seem to recognize 
WAV (.wav) and MP3 (.mp3)audio, so these would be safe choices 
for audio examples. Audio files are stored inside inside the browser. Storage size
inside the browser is limited, so small compressed files are prefered. 
Don't forget to include a LICENSE.txt file with the copyright and licensing 
information.

It is possible to use SpeakGoodChinese to record student audio  
for evaluation. On the Settings page, select an existing or new 
Archive and press the Save Audio button. A blue 
dot will be displayed in the lower right corner of the Main page as 
long as recordings are stored. While the blue dot is visible on the 
Main page, all audio is stored! Recorded audio can also be listened to
as long as the Save Audio button is on, by clicking Play.
Recordings are overwritten when the same pinyin word is recorded.

The recorded audio segments have names 
constructed of the pinyin spelling of the word and the extention .wav. 
Every recording will overwrite existing recordings of the same pinyin 
word. The storage of recordings can be terminated by pressing the 
Save Audio button again. The Archive containing the recorded 
audio can be exported by clicking the Export button. A zip 
archive with the name of the Archive will be stored in the default 
download directory of your browser. This archive can be send to the teacher
who can load it using the Import button. While the Save Audio
button is on, the recorded audio can be played back and evaluated (press 1-0 for
grades 1-10).

The recorded audio can also be used as examples for a wordlist (see above).
Select those recordings you consider good enough as examples and copy them to the 
target wordlist directory for inclusion.


Word lists with "real" Pinyin

It is often inconvennient to compile lists using a number scheme for 
pinyin. SGC3 will recognize standard UTF8 pinyin. But we do advice to 
use the numbered tone scheme as this is much less prone to errors.

Example: SGC2example4.tsv
Pinyin	Character	Sound	Translation	Lesson
chī	吃	-	to eat	1
zhǐ​yǒu	只有	-	only	2

In this type of pinyin, the syllable boundaries can be 
ambiguous, as in the combination nán​gōng or xīngān. To prevent 
errors in SGC3, place a '-quote at the boundary, e.g., "Xīng'ān".


Word selection and Lessons

The words for a course can be listed in a single word list where the words
are assigned to numbered or named Parts or Lessons. The 
wordlist table can contain a collumn with the label Part or Lesson 
and a lesson number or name for each line. 

Students can select the words to practise on the Main page. In the 
Word List menu on the right, select the Words choice 
(above the Word List entry). This will open a new tab with the
name Select Words. Note that this tab will close automatically 
if you leave the page. On this tab, you can select which tones you want 
to practice in the menu on the left. If the word list has Parts, 
named or numbered lessons, you can select them in the menu next to that.

Example: SGC2example5.tsv
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

