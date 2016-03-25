
var drawingArea;

var setDrawingParam = function (canvasId) {
	drawingArea = document.getElementById(canvasId);
	resetDrawingParam();
};

var resetDrawingParam = function () {
	var drawingCtx = drawingArea.getContext("2d");
	drawingCtx.clearRect(0, 0, drawingCtx.width, drawingCtx.height);
	drawingCtx.lineWidth = 4;
	drawingCtx.strokeStyle = "green";
	drawingCtx.lineCap = "round";
	drawingCtx.lineJoin = "round";
};

var testDrawing = function (color, order) {
	var drawingCtx = drawingArea.getContext("2d");
	drawingCtx.beginPath();
	drawingCtx.strokeStyle = color;
	drawingCtx.moveTo(250 + order,250);
	drawingCtx.lineTo(750 - order,750);
	drawingCtx.stroke();
};
	
	
// Handle tone examples
function get_tones (pinyin) {
	var tones = pinyin.replace(/[^\d]+(\d)/g, "$1");
	return tones;
};

function convertVoicing (pinyin) {
	var voicing = pinyin.replace(/(ng|[wrlmny])/g, "C");
	voicing = voicing.replace(/(sh|ch|zh|[fsxhktpgqdbzcj])/g, "U");
	voicing = voicing.replace(/[^CU0-9]/g, "V");
	return voicing;
};

function toneRules (topline, frequencyRange, prevTone, currentTone, nextTone) {
	//
	// Movements
	var toneRules_range_Factor = 1;
	// start * ?Semit is a fall
	// start / ?Semit is a rise
	// 1/(12 semitones)
	var toneRules_octave = 0.5;
	// 1/(9 semitones)
	var toneRules_nineSemit = 0.594603557501361;
	// 1/(6 semitones)
	var toneRules_sixSemit = 0.707106781186547;
	// 1/(3 semitones) down
	var toneRules_threeSemit = 0.840896415253715;
	// 1/(2 semitones) down
	var toneRules_twoSemit = 0.890898718140339;
	// 1/(1 semitones) down
	var toneRules_oneSemit = 0.943874313;
	// 1/(4 semitones) down
	var toneRules_fourSemit = toneRules_twoSemit * toneRules_twoSemit;
	// 1/(5 semitones) down
	var toneRules_fiveSemit = toneRules_threeSemit * toneRules_twoSemit;

	var toneRules_frequency_Range = toneRules_octave;
	if(toneRules_range_Factor > 0) {
    	toneRules_frequency_Range =  toneRules_frequency_Range * toneRules_range_Factor;
	}
	
    //
    // Tone toneRules_levels 1-5
    // Defined relative to the topline and the frequency range
    var toneRules_levelFive = topLine;
    var toneRules_levelOne = topLine * frequencyRange;
    var toneRules_levelThree = topLine * Math.sqrt(frequencyRange);
    var toneRules_levelTwo = topLine * Math.sqrt(Math.sqrt(frequencyRange));
    var toneRules_levelFour = toneRules_levelOne / Math.sqrt(Math.sqrt(frequencyRange));

}

// Take a word and create tone contour
function word2tones (pinyin, highpitch) {
	var tones = get_tones (pinyin);
	var tonecontour;
	var currentTime = 0.1;
	
	
	

}

function plot_example (pinyin) {
	resetDrawingParam ();
	
};
