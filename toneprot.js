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

// Durations must be scaled
var	toneScript_segmentDuration = 0.150;
var	toneScript_fixedDuration = 0.12;
var toneScript_voicedDuration = toneScript_segmentDuration;
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
	
	/*
	 * Tone rules Levels (semitones) Duration factor
	 * Tone 1: L 5 - 5,         D 1
	 * Tone 2: L 3(-1) - 5(+1), D 0.8
	 * Tone 3: L 3 - 1(-3) - 3, D 1.1
	 * Tone 4: L 5(+2) - 1*,    D 0.8
	 * Tone 0: L 3 - 2,         D 0.5
	 * 
	 * *Tone 4 endpoint is (startPoint - frequencyRange)!
	 * 
	 */
	
	var currentToneContour;
	var p = 0;
	var time = 0;
	var startPoint, midPoint, endPoint;
	
	if(currentTone == 1) {
		// Just a straight horizontal line
		startPoint = toneRules_levelFive
		endPoint = toneRules_levelFive
		
		// Two first tones, make them a little different
		if(prevTone = 1) {
			startPoint = toneRules_startPoint * 0.999
			endPoint = toneScript_endPoint * 0.999
		}
		// Write toneScript.points
		currentToneContour[p] = [time, startPoint];
		++p;
		time += toneScript_voicedDuration;
		currentToneContour[p] = [time, endPoint];		
	}
	else if(currentTone == 2) {
	}
	else if(currentTone == 3) {
	}
	else if(currentTone == 4) {
	}
	else if(currentTone == 0) {
	}
	
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
