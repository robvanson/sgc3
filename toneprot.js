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
function getTones (pinyin) {
	var tones = pinyin.replace(/[^\d]+(\d)/g, "$1");
	return Number(tones);
};

function convertVoicing (pinyin) {
	var voicing = pinyin.replace(/(ng|[wrlmny])/g, "C");
	voicing = voicing.replace(/(sh|ch|zh|[fsxhktpgqdbzcj])/g, "U");
	voicing = voicing.replace(/[^CU0-9]/g, "V");
	return voicing;
};


// Global constants
//
toneRules_absoluteMinimum = 80

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

var toneScript_delta = 0.00001;
var	toneScript_segmentDuration = 0.150;
var	toneScript_fixedDuration = 0.12;
var toneScript_margin = 0.25


/*
 * Tone Duration factor
 * Tone 1: D 1
 * Tone 2: D 0.8
 * Tone 3: D 1.1
 * Tone 4: D 0.8
 * Tone 0: D 0.5
 * 
 * Durations must be scaled
 * Returns the factor with which the duration must be scaled
 * 
 */
// Procedure to scale the duration of the current syllable
function toneDuration (prevTone, currentTone, nextTone) {
	var toneFactor = 1;
	if(currentTone == 0) {
		var zeroToneFactor;
		zeroToneFactor = 0.5
        if (prevTone == 2) {
            zeroToneFactor = 0.8 * zeroToneFactor
        } else if (prevTone == 3) {
            zeroToneFactor = 1.1 * zeroToneFactor
        } else if (prevTone == 4) {
            zeroToneFactor = 0.8 * zeroToneFactor
        }
        toneFactor = zeroToneFactor * toneFactor
	} else if (currentTone == 2) {
		toneFactor = 0.8
	} else if (currentTone == 3) {
		toneFactor = 1.1
    } else if (currentTone == 4) {
		toneFactor == 0.8
	}
    
	// Next tone 0, then lengthen first syllable
	if (nextTone == 0) {
		toneFactor = toneFactor * 1.2
	};
	
	return toneFactor;
}

function toneRules (topLine, time, lastFrequency, voicedDuration, prevTone, currentTone, nextTone) {
	
	var syllableToneContour = [];
	var durationFactor = toneDuration (prevTone, currentTone, nextTone);
	
	var frequencyRange = toneRules_octave;
	if(toneRules_range_Factor > 0) {
		frequencyRange =  frequencyRange * toneRules_range_Factor;
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
	
	var p = 0;
	var startPoint, midPoint, lowestPoint, endPoint;
	
	// Tone 1
	if(currentTone == 1) {
		// Just a straight horizontal line
		startPoint = toneRules_levelFive
		endPoint = toneRules_levelFive
		
		// Two first tones, make them a little different
		if(prevTone == 1) {
			startPoint = startPoint * 0.999
			endPoint = endPoint * 0.999
		}
		
		// Write tone points
		syllableToneContour[p] = [time, startPoint];
		++p;
		time += voicedDuration;
		syllableToneContour[p] = [time, endPoint];		
	}
	// Tone 2
	else if(currentTone == 2) {
        // Start halfway of the range - 1 semitone
        startPoint = toneRules_levelThree * toneRules_oneSemit
        // End 1 semitones above the first tone
        endPoint = toneRules_levelFive / toneRules_oneSemit
        
        // Special case: 2 followed by 1, stop short of the top-line
        // ie, 5 semitones above the start
        if (nextTone == 1) {
            endPoint = startPoint / toneRules_fiveSemit
	    }
	    
	    // Go lower if previous tone is 1
	    if (prevTone == 1) {
	        startPoint = startPoint * toneRules_oneSemit
        } else if ( prevTone == 4 || prevTone == 3) {
            // Special case: 2 following 4 or 3
            // Go 1 semitone up
	        startPoint = lastFrequency / toneRules_oneSemit
            endPoint = toneRules_levelFive
	    } else if (prevTone == 2) {
        // Two consecutive tone 2, start 1 semitone higher
		    startPoint = startPoint / toneRules_oneSemit
        }
        
		// Write points
		syllableToneContour[p] = [time, startPoint];
        // Next point flat to 1/3th of duration
		++p;
		time += voicedDuration / 3;
		syllableToneContour[p] = [time, startPoint];		
        // Next point a end
 		++p;
		time += voicedDuration * 2 / 3;
		syllableToneContour[p] = [time, endPoint];		
 	}
	// Tone 3
	else if(currentTone == 3) {
        // Halfway the range
        startPoint = toneRules_levelThree
        lowestPoint = toneRules_levelOne * toneRules_threeSemit
        // Protect pitch against "underflow"
        if(lowestPoint < toneRules_absoluteMinimum) {
            lowestPoint = toneRules_absoluteMinimum;
        }
        
        // First syllable
        if (nextTone < 0) {
            endPoint = startPoint
        // Anticipate rise in next tone
        } else if (nextTone == 1 || nextTone == 4) {
            lowestPoint = toneRules_levelOne / toneRules_twoSemit
            endPoint = startPoint
        // Anticipate rise in next tone and stay low
        } else if (nextTone == 2) {
            lowestPoint = toneRules_levelOne / toneRules_twoSemit
            endPoint = lowestPoint
        // Last one was low, don't go so much lower
        } else if (prevTone == 4) {
            lowestPoint = toneRules_levelOne * toneRules_oneSemit
        // Anticipate rise in next tone and stay low
        } else if (nextTone == 0) {
            lowestPoint = toneRules_levelOne
            endPoint = lowestPoint / toneRules_sixSemit
        } else {
            endPoint = startPoint
        }
        
		// Write points
		syllableToneContour[p] = [time, startPoint];
        // Go 1/3 of the duration down
 		++p;
	    time += (voicedDuration)*2/6
		syllableToneContour[p] = [time, lowestPoint];
        // Go half the duration low
 		++p;
	    time += (voicedDuration)*3/6
		syllableToneContour[p] = [time, lowestPoint];
        // Return in 1/6th of the duration
 		++p;
	    time += (voicedDuration)*1/6
		syllableToneContour[p] = [time, endPoint];
	}
	// Tone 3 with voice break
	// Lowest frequencies are voiceless (F0 = 0)
	else if(currentTone == 9) {
        // Halfway the range
        startPoint = toneRules_levelThree
        lowestPoint = toneRules_levelOne * toneRules_threeSemit
        // Protect pitch against "underflow"
        if(lowestPoint < toneRules_absoluteMinimum) {
            lowestPoint = toneRules_absoluteMinimum;
        }
        
        // First syllable
        if (nextPoint < 0) {
            endPoint = startPoint
        // Anticipate rise in next tone
        } else if (nextPoint == 1 || nextPoint == 4) {
            lowestPoint = toneRules_levelOne / toneRules_twoSemit
            endPoint = startPoint
        // Anticipate rise in next tone and stay low
        } else if (nextPoint == 2) {
            lowestPoint = toneRules_levelOne / toneRules_twoSemit
            endPoint = lowestPoint
        // Last one was low, don't go so much lower
        } else if (prevTone == 4) {
            lowestPoint = toneRules_levelOne * toneRules_oneSemit
        // Anticipate rise in next tone and stay low
        } else if (nextPoint == 0) {
            lowestPoint = toneRules_levelOne
            endPoint = lowestPoint / toneRules_sixSemit
        } else {
            endPoint = startPoint
        }
        
		// Write points
		syllableToneContour[p] = [time, startPoint];
        // Go 1/3 of the duration down
 		++p;
	    time += (voicedDuration)*2/6
		syllableToneContour[p] = [time, lowestPoint];

        // voiceless break
 		++p;
       	var delta = time + 0.001
		syllableToneContour[p] = [delta, 0];

        // Go half the duration low
	    time += (voicedDuration)*3/6
	    
 		++p;
       	delta = time - 0.001
 		syllableToneContour[p] = [delta, 0];
       
        // After voiceless break
 		++p;
		syllableToneContour[p] = [time, lowestPoint];
        // Return in 1/6th of the duration
 		++p;
	    time += (voicedDuration)*1/6
		syllableToneContour[p] = [time, endPoint];
	}
	// Tone 4
	else if(currentTone == 4) {
        // Start higher than tone 1 (by 2 semitones)
        startPoint = toneRules_levelFive / toneRules_twoSemit
        // Go down the full range
        endPoint = startPoint * frequencyRange
        
        // SPECIAL: Fall in following neutral tone
	    if (nextTone == 0) {
	        endPoint = endPoint / toneRules_threeSemit
        }
     
        // Define a midtoneScript.point at 1/3 of the duration
        var midPoint = startPoint
        
		// Write points
		syllableToneContour[p] = [time, startPoint];
        // Next point a 1/3th of duration
		++p;
		time += voicedDuration / 3;
		syllableToneContour[p] = [time, startPoint];		
        // Next point a end
 		++p;
		time += voicedDuration * 2 / 3;
		syllableToneContour[p] = [time, endPoint];		
	}
	// Tone 0
	else if(currentTone == 0) {
		
        if (lastFrequency > 0) {
            startPoint = lastFrequency
        } else {
            startPoint = toneRules_levelThree / toneRules_oneSemit
        };

        if (prevTone == 1) {
            startPoint = lastFrequency * toneRules_twoSemit 
        } else if (prevTone == 2) {
            startPoint = lastFrequency
        } else if (prevTone == 3) {
            startPoint = lastFrequency / toneRules_oneSemit
        } else if (prevTone == 4) {
            startPoint = lastFrequency * toneRules_oneSemit
        } else if (lastFrequency > 0) {
            startPoint = lastFrequency * toneRules_oneSemit
        };

        // Catch all errors
        if (startPoint <= 0) {
            startPoint = toneRules_levelThree / toneRules_oneSemit
        };
        
       // Add spreading and some small or large de/inclination
        if (prevTone == 1) {
        	midPoint = startPoint * frequencyRange / toneRules_oneSemit
            endPoint = midPoint * toneRules_oneSemit
        } else if (prevTone == 2) {
        	midPoint = startPoint * toneRules_fiveSemit
            endPoint = midPoint * toneRules_twoSemit
        } else if (prevTone == 3) {
        	midPoint = startPoint / toneRules_twoSemit
            endPoint = midPoint
        } else if (prevTone == 4) {
        	midPoint = startPoint * toneRules_threeSemit
            endPoint = midPoint / toneRules_oneSemit
        } else {
        	midPoint = startPoint * toneRules_oneSemit
            endPoint = midPoint
        };
                
        
		// Write points, first 2/3 then decaying 1/3
		syllableToneContour[p] = [time, startPoint];
		++p;
		time += (voicedDuration - 1/startPoint) * 2 / 3;
		syllableToneContour[p] = [time, midPoint];		
        // Next point a end
 		++p;
		time += (voicedDuration - 1/startPoint) * 1 / 3;
		syllableToneContour[p] = [time, endPoint];		
	}
	// Non-tone intonation
	else {
        // Start halfway of the range
        startPoint = toneRules_levelThree
        // Or continue from last Non-"tone"
        if (prevTone == 6) {
            startPoint = lastFrequency
        }
        // Add declination
        endPoint = startPoint * toneRules_oneSemit
        
		// Write tone points
		syllableToneContour[p] = [time, startPoint];
		++p;
		time += voicedDuration;
		syllableToneContour[p] = [time, endPoint];		
	}
	return syllableToneContour;
}

// Create a syllable tone movement
function addToneMovement (time, lastFrequency, syllable, topLine, prevTone, nextTone) {
	var currentToneContour = [];
	var p = 0;
	// Get tone
	var toneSyllable = getTones(syllable);
	// Tone sandhi: 3-3 => 2-3
    if (toneSyllable == 3 && nextTone == 3) {
        toneSyllable = 2
    };
	
	// Get voicing pattern
	var voicingSyllable = convertVoicing(syllable);

	// Account for tones in duration
    // Scale the duration of the current syllable
    var toneFactor = toneDuration (prevTone, toneSyllable, nextTone)

	// Unvoiced part
	if (voicingSyllable.match(/U/g)) {
		time += toneScript_delta;
		currentToneContour[p] = [time, 0];
		++p;
		time += toneScript_segmentDuration * toneFactor;
		currentToneContour[p] = [time, 0];
	}
	
	// Voiced part
	var voicedLength = voicingSyllable.replace(/U*([CV]+)U*/g, "$1").length;
	var voicedDuration = toneFactor * (toneScript_segmentDuration * voicedLength + toneScript_fixedDuration)
	time += toneScript_delta;
	
	/*
	 * Write contour of each tone
	 * Note that tones are influenced by the previous (tone 0) and next (tone 3)
	 * tones. Tone 6 is the Dutch intonation
	 * sqrt(frequencyRange) is the mid point
	 * 
	 */
    var voicedContour = toneRules (topLine, time, lastFrequency, voicedDuration, prevTone, toneSyllable, nextTone);
	currentToneContour.push(voicedContour);
    return currentToneContour;
}

// Take a word and create tone contour
function word2tones (pinyin, topLine) {
	var toneContour = [];
	var word;

	var pinyinWithSpaces = pinyin.replace(/([\d]+)/g, "$1 ");
	pinyinWithSpaces = pinyinWithSpaces.replace(/ $/, "");
	var syllableList = pinyinWithSpaces.split(" ");
	
	// Start toneContour with margin
	var time = 0;
	var p = 0;
	toneContour[p] = [time, 0];
	++p;
	time += toneScript_margin
	toneContour[p] = [time, 0];
	lastFrequency = 0;
	for(s = 0; s < syllableList.length; ++s) {
		var prevTone = -1;
		var nextTone = -1;
		var syllable = syllableList[s];
		if(s-1 >= 0) prevTone = Number(syllableList[s-1].replace(/[^\d]+/g, ""));
		if(s+1 < syllableList.length) nextTone = Number(syllableList[s+1].replace(/[^\d]+/g, ""));
		var syllableContour = addToneMovement (time, lastFrequency, syllable, topLine, prevTone, nextTone);
		toneContour.push(syllableContour);
		time = toneContour[(toneContour.length - 1)][0];
		lastFrequency = toneContour[(toneContour.length - 1)][1];
	};
	return toneContour;
}

function plot_example (pinyin) {
	resetDrawingParam ();
	
};
