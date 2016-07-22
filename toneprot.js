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

/*
 * Global variables from audioProcessing.js
 * 
 * var recordedBlob, recordedBlobURL;
 * var recordedArray, currentAudioWindow;
 * var recordedSampleRate, recordedDuration;
 * 
 */

var performanceRecord = {};
var recordPerformance = true;

var setDrawingParam = function (canvasId) {
	var drawingArea = document.getElementById(canvasId);
	var drawingCtx = drawingArea.getContext("2d");
	return drawingCtx;
};

var initializeDrawingParam = function (canvasId) {
	var drawingArea = document.getElementById(canvasId);
	var drawingCtx = drawingArea.getContext("2d");
	resetDrawingParam(drawingCtx);
	return drawingCtx;
};

var resetDrawingParam = function (drawingCtx) {
	drawingCtx.clearRect(0, 0, drawingCtx.canvas.width, drawingCtx.canvas.height);
	drawingCtx.lineWidth = 8;
	drawingCtx.strokeStyle = "green";
	drawingCtx.lineCap = "round";
	drawingCtx.lineJoin = "round";
};

var testDrawing = function (canvasId, color, order) {
	var drawingCtx = setDrawingParam(canvasId)
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

function numSyllables (pinyin) {
	var tones = pinyin.replace(/[^\d]+(\d)/g, "$1");
	return tones.length;
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
var dx = 0.01;


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

// The rules to create pitch tracks from tones
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
		syllableToneContour.push({"t": time, "f": startPoint});;
		time += voicedDuration;
		syllableToneContour.push({"t": time, "f": endPoint});;		
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
		syllableToneContour.push({"t": time, "f": startPoint});;
        // Next point flat to 1/3th of duration
		time += voicedDuration / 3;
		syllableToneContour.push({"t": time, "f": startPoint});;		
        // Next point a end
		time += voicedDuration * 2 / 3;
		syllableToneContour.push({"t": time, "f": endPoint});;		
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
		syllableToneContour.push({"t": time, "f": startPoint});;
        // Go 1/3 of the duration down
	    time += (voicedDuration)*2/6
		syllableToneContour.push({"t": time, "f": lowestPoint});;
        // Go half the duration low
	    time += (voicedDuration)*3/6
		syllableToneContour.push({"t": time, "f": lowestPoint});;
        // Return in 1/6th of the duration
	    time += (voicedDuration)*1/6
		syllableToneContour.push({"t": time, "f": endPoint});;
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
		syllableToneContour.push({"t": time, "f": startPoint});;
        // Go 1/3 of the duration down
	    time += (voicedDuration)*2/6
		syllableToneContour.push({"t": time, "f": lowestPoint});;

// CHECK THIS !!!
        // voiceless break
       	var delta = time + 0.001
		syllableToneContour.push({"t": delta, "f": 0});

        // Go half the duration low
	    time += (voicedDuration)*3/6
	    
       	delta = time - 0.001
		syllableToneContour.push({"t": delta, "f": 0});
       
        // After voiceless break
		syllableToneContour.push({"t": time, "f": lowestPoint});;
        // Return in 1/6th of the duration
	    time += (voicedDuration)*1/6
		syllableToneContour.push({"t": time, "f": endPoint});;
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
		syllableToneContour.push({"t": time, "f": startPoint});;
        // Next point a 1/3th of duration
		time += voicedDuration / 3;
		syllableToneContour.push({"t": time, "f": startPoint});;		
        // Next point a end
		time += voicedDuration * 2 / 3;
		syllableToneContour.push({"t": time, "f": endPoint});;		
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
		syllableToneContour.push({"t": time, "f": startPoint});;
		time += (voicedDuration - 1/startPoint) * 2 / 3;
		syllableToneContour.push({"t": time, "f": midPoint});;		
        // Next point a end
		time += (voicedDuration - 1/startPoint) * 1 / 3;
		syllableToneContour.push({"t": time, "f": endPoint});;		
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
		syllableToneContour.push({"t": time, "f": startPoint});;
		time += voicedDuration;
		syllableToneContour.push({"t": time, "f": endPoint});;		
	}
	return syllableToneContour;
}

// Create a syllable tone movement
function addToneMovement (time, lastFrequency, syllable, topLine, prevTone, nextTone) {
	var currentToneContour = [];
	// Get tone
	var toneSyllable = getTones(syllable);
	// Tone sandhi: 3-3/9-9 => 2-3
    if ((toneSyllable == 3 || toneSyllable == 9) && (nextTone == 3 || nextTone == 9)) {
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
		currentToneContour.push({"t": time, "f": 0});;
		time += toneScript_segmentDuration * toneFactor;
		currentToneContour.push({"t": time, "f": 0});;
	}
	
	// Voiced part
	var voicedLength = voicingSyllable.replace(/U*([CV]+)U*/g, "$1").length;
	var voicedDuration = toneFactor * (toneScript_segmentDuration * voicedLength + toneScript_fixedDuration)
	time += toneScript_delta;
	
	/*
	 * Write contour of each tone
	 * Note that tones are influenced by the previous (tone 0) and next (tone 3)
	 * tones. Tone 6 is the NO TONE intonation
	 * sqrt(frequencyRange) is the mid point
	 * 
	 */
    var voicedContour = toneRules (topLine, time, lastFrequency, voicedDuration, prevTone, toneSyllable, nextTone);
    currentToneContour = currentToneContour.concat(voicedContour);
    return currentToneContour;
}

// Take a word and create tone contour
// !!! Add addapted highest tone and range !!!
function word2tones (pinyin, topLine) {
	var toneContour = [];
	var word;

	var pinyinWithSpaces = pinyin.replace(/([\d]+)/g, "$1 ");
	pinyinWithSpaces = pinyinWithSpaces.replace(/ $/, "");
	var syllableList = pinyinWithSpaces.split(" ");
	
	// Start toneContour with margin
	var time = 0;
	toneContour.push({"t": time, "f": 0});;
	time += toneScript_margin
	toneContour.push({"t": time, "f": 0});;
	lastFrequency = 0;
	for(s = 0; s < syllableList.length; ++s) {
		var prevTone = -1;
		var nextTone = -1;
		var syllable = syllableList[s];
		if(s-1 >= 0) prevTone = Number(syllableList[s-1].replace(/[^\d]+/g, ""));
		if(s+1 < syllableList.length) nextTone = Number(syllableList[s+1].replace(/[^\d]+/g, ""));
		var syllableContour = addToneMovement (time, lastFrequency, syllable, topLine, prevTone, nextTone);
		toneContour = toneContour.concat(syllableContour);
		time = toneContour[(toneContour.length - 1)].t;
		lastFrequency = toneContour[(toneContour.length - 1)].f;
	};
	// Trailing margin
	time += toneScript_delta;
	toneContour.push({"t": time, "f": 0});;
	time += toneScript_margin
	toneContour.push({"t": time, "f": 0});
	/* Create PitchTier 
	 * { "xmin": 0, "xmax": duration, "points": [{"t": t, "f":, f},{}]}
	 * 
	 */
	// First create points
	var points = [];
	var timeSeries = [];
	var valueSeries = [];
	var pitchTier = new Tier ();
	pitchTier.dT = dx;
	for(x = dx/2; x < time; x += dx) {
		// Locate tone stretch
		var i = 0;
		for(i=0; i< toneContour.length && toneContour[i].t < x; ++i) ;
		// Interpolate tone if BOTH are non-zero
		var value = 0;
		var prefT = toneContour[i-1].t;
		var prefF = toneContour[i-1].f;
		var nextT = toneContour[i].t;
		var nextF = toneContour[i].f;
		// When the second part is "0", it is treated as a string concatenation
		if(prefF > 0 && nextF > 0) {
			value = Number(prefF) + Number((x - prefT)/(nextT - prefT)*(nextF - prefF));
		}
		pitchTier.pushItem({"x": x, "value": value});
	};
	return pitchTier;
}

// Filter pitchTier to get more realistic joins
function smooth_pitchTier (pitchTier) {
	var prevTime = -1;
	var prevValue = 0;
	var currentTime = -1;
	var currentValue = 0;
	for(var i = 1; i < pitchTier.size; i+=1) {
		var item = pitchTier.item(i);
		nextTime = item.x;
		nextValue = item.value;
		
		// Change currentValue as the average of prev, current, and next
		// NOTE: Do not use the changed value for the next round!!!
		if (prevValue > 0 && currentValue > 0 && nextValue > 0) {
			var item = pitchTier.item(i-1);
			item.value = (prevValue + currentValue + nextValue) / 3;
			pitchTier.writeItem(i-1, item);
		};
		// Next round
		prevTime = currentTime;
		prevValue = currentValue;
		currentTime = nextTime;
		currentValue = nextValue;
	};
};

// Plot the pitch tier on the canvas
function plot_pitchTier (canvasId, color, lineWidth, topLine, pitchTier) {
	var drawingCtx = setDrawingParam(canvasId);
	var plotWidth = drawingCtx.canvas.width
	var plotHeight = drawingCtx.canvas.height
	
	// Set parameters
	drawingCtx.beginPath();
	drawingCtx.strokeStyle = color;
	drawingCtx.lineWidth = lineWidth;
	
	// Scale to plot area
	var tmin = pitchTier.xmin;
	var tmax = pitchTier.xmax;
	var tScale = plotWidth / (pitchTier.xmax - pitchTier.xmin);
	var vScale = plotHeight / (2*topLine - 0.4*topLine);
	
	var prevTime = -1;
	var prevValue = 0;
	for(var i = 1; i < pitchTier.size; i+=1) {
		var item = pitchTier.item(i);
		currentTime = item.x;
		currentValue = item.value;
		if(prevValue > 0 && currentValue > 0) {
			drawingCtx.lineTo(currentTime * tScale, plotHeight - currentValue * vScale);
		} else if (prevValue <= 0 && currentValue > 0) {
			drawingCtx.moveTo(currentTime * tScale, plotHeight - currentValue * vScale);
		} else if (prevValue > 0 && currentValue <= 0) {
			drawingCtx.stroke();
		};
		prevTime = currentTime;
		prevValue = currentValue;
	};
	drawingCtx.stroke();
};

function draw_example_pinyin (id, pinyin) {
	if (pinyin.match(/\d/)) {
		topLine = getRegister();
		var pitchTier = word2tones (pinyin, topLine);
		smooth_pitchTier (pitchTier);
		plot_pitchTier (id, "green", 8, topLine, pitchTier);
	} else {
		setDrawingParam(id);
	};
};

function draw_test_signal (Id, pinyin) {
	topLine = getRegister();
	var pitchTier = testPitchTracker (2, 44100);
	plot_pitchTier (Id, "blue", 8, topLine, pitchTier);
};

var lightSize = 15;
var maxPowerRecorded = 90;
var thresshold = 0.1;
function display_recording_level (id, recordedArray) {
	var sumSquare = 0;
	var nSamples = 0;
	for (var i = 0; i < recordedArray.length; ++i) {
		if(Math.abs(recordedArray[i]) > thresshold) {
			sumSquare += recordedArray[i] * recordedArray[i];
			++nSamples;
		};
	};
	var power = sumSquare / nSamples;
	var dBpower = (power > 0) ? maxPowerRecorded + 2*Math.log10(power) * 10 : 0;
	var recordingLight = document.getElementById(id);
	var currentWidth = 100*recordingLight.clientWidth/window.innerWidth;
	var currentHeight = 100*recordingLight.clientHeight/window.innerHeight;
	var horMidpoint = 5 + currentWidth/2;
	var verMidpoint = 5 + currentHeight/2;
	
	// New fontSize
	var fontSize = lightSize*dBpower/maxPowerRecorded + 1;
	recordingLight.style.fontSize = fontSize + "vmin";
	
	// position = midpoint - newFontSize / 2
	recordingLight.style.top = (verMidpoint - ((fontSize/lightSize)*currentHeight)/2) + "%";
	recordingLight.style.left = (horMidpoint - ((fontSize/lightSize)*currentWidth)/2) + "%";
};

function draw_tone (id, color, typedArray, sampleRate) {
	var fMin = 75;
	var fMax = 600;
	var dT = 0.01;
	var topLine = getRegister();

	pitchTier = toPitchTier (typedArray, sampleRate, fMin, fMax, dT);
	plot_pitchTier (id, color, 4, topLine, pitchTier);
	
	return pitchTier;
}

var recognition = {
		Recognition: "",
		Feedback: "",
		Label: "Correct",
		Register: "OK",
		Range: "OK"
	};

function recognition2performance (pinyin, recognition, performanceRecord) {
	if (! performanceRecord [sgc3_settings.currentCollection] ) 
			performanceRecord [sgc3_settings.currentCollection] = {};
	var wordList = performanceRecord [sgc3_settings.currentCollection];
	if (! wordList[pinyin] ) {
		wordList[pinyin] = {
			"Grade" : -1,
			"Correct" : 0,
			"Wrong" : 0,
			"High" : 0,
			"Low" : 0,
			"Wide" : 0,
			"Narrow" : 0,
			"Date" : ""
		};
	};
	++wordList[pinyin][recognition.Label];
	if(recognition.Register != "OK")++wordList[pinyin][recognition.Register];
	if(recognition.Range != "OK")++wordList[pinyin][recognition.Range];
	var d = new Date();
	wordList[pinyin]["Date"] = d.toLocaleDateString() + " " + d.toLocaleTimeString();
};

function setGRADE (pinyin, grade) {
	if (! performanceRecord [sgc3_settings.currentCollection] ) 
			performanceRecord [sgc3_settings.currentCollection] = {};
	var wordList = performanceRecord [sgc3_settings.currentCollection];
	if (! wordList[pinyin] ) {
		wordList[pinyin] = {
			"Grade" : -1,
			"Correct" : 0,
			"Wrong" : 0,
			"High" : 0,
			"Low" : 0,
			"Wide" : 0,
			"Narrow" : 0,
			"Date" : ""
		};
	};
	wordList[pinyin].Grade = grade == 0 ? 10 : grade;
console.log(performanceRecord);
};
	
// Handle sound after decoding (used in audioProcessing.js)
function processRecordedSound () {
	if(recordedArray) {
		display_recording_level ("RecordingLight", recordedArray);
		
		initializeDrawingParam ("TonePlot");
		draw_example_pinyin ("TonePlot", currentPinyin);
		if (recordedPitchTier) {
			plot_pitchTier ("TonePlot", "red", 4, getRegister(), recordedPitchTier);
		} else {
			recordedPitchTier = draw_tone ("TonePlot", "red", recordedArray, recordedSampleRate)
		};
		recognition = sgc_ToneProt (pitchTier, currentPinyin, sgc3_settings.register, sgc3_settings.strict, sgc3_settings.language);
		
		// Only do this ONCE for every recording
		if(recordPerformance && sessionStorage.recorded == "true") recognition2performance(currentPinyin, recognition, performanceRecord);
		if(sgc3_settings.saveAudio && sessionStorage.recorded == "true") {
			// get Lesson
			var currentWord = JSON.parse(localStorage.sgc3_currentWord);
			var lesson = currentWordlist[currentWord][4];
			lesson = (lesson && lesson != "-") ? " "+lesson : "";
			saveCurrentAudioWindow (sgc3_settings.currentCollection, sgc3_settings.wordList+lesson, currentPinyin+".wav");
		};
		
		// Write results
		document.getElementById("ResultString").textContent = recognition.Recognition;
		document.getElementById("ResultString").style.color = (recognition.Label == "Correct") ? "green" : "red";
		document.getElementById("FeedbackString").textContent = recognition.Feedback;
		document.getElementById("FeedbackString").style.color = (recognition.Label == "Correct") ? "green" : "red";
		
		// Set play button
		if(currentAudioWindow.length > 0) {
			document.getElementById('PlayButton').disabled = false;
			document.getElementById('PlayButton').style.color = "red";
		};		    

	};
};

// Tone recogition
// Set up the tone context and start recognition
function sgc_ToneProt (pitchTier, pinyin, register, proficiency, language) {
	var recognitionText = numbersToTonemarks(pinyin)+": ";
	var feedbackText = "";
	var labelText = "";
	var topLine = getRegister();
	
	// Clean up pinyin
	// Remove spaces
	pinyin = pinyin.replace(/^\s*(.+)\s*$/g, "$1");
	// 5 used as neutral tone number
	pinyin = pinyin.replace(/5/g, "0");
	// Add missing neutral tones
	pinyin = add_missing_neutral_tones (pinyin);

	// Create a model tone pronunciation
	var tonePitchTier = word2tones (pinyin, topLine);

	// Set up recognition values
 	var precision = 3;
	if (proficiency >= 3) {
		precision = 1.5
	};
	// Stick to the raw recognition results or not
	var ultraStrict = (proficiency >= 3);

	// Reduction (lower sgc_ToneProt.register and narrow range) means errors
	// The oposite mostly not. Asymmetry alows more room upward
	// than downward (asymmetry = 2 => highBoundaryFactor ^ 2)
	var asymmetry = 2;
	
	var spacing = 0.5;
	var speedFactor = 1;
	var speechDuration = pitchTier.xmax;
	var modelDuration = tonePitchTier.xmax;
	var precisionFactor = Math.pow(2,(precision/12));
	var highBoundaryFactor = Math.pow(precisionFactor, asymmetry);
	var lowBoundaryFactor = 1/precisionFactor
	
	// Get top and range of model
	var tonePercentiles = get_percentiles (tonePitchTier.valueSeries(), function (a, b) { return a-b;}, function(a) { return a <= 0;}, [5, 95]);
	maximumModelFzero = (tonePercentiles[1].value > 0) ? tonePercentiles[1].value : 0;
	minimumModelFzero = (tonePercentiles[0].value > 0) ? tonePercentiles[0].value : 0;
	var modelPitchRange = 2; // 1 octave
	if (minimumModelFzero > 0) {
    	modelPitchRange = maximumModelFzero / minimumModelFzero;
    } else {
		modelPitchRange = 0
	};
	
	// Get top and range of recorded word
	var pitchPercentiles = get_percentiles (pitchTier.valueSeries(), function (a, b) { return a-b;}, function(a) { return a <= 0;}, [5, 95]);
	maximumRecFzero = pitchPercentiles[1].value > 0 ? pitchPercentiles[1].value : 0;
	minimumRecFzero = pitchPercentiles[0].value > 0 ? pitchPercentiles[0].value : 0;
	var recPitchRange = 2; // 1 octave
	if (minimumRecFzero > 0) {
    	recPitchRange = maximumRecFzero / minimumRecFzero;
    } else {
		recPitchRange = 0;
	};

	var recordedMinMax = get_time_of_minmax (pitchTier);
	
	// Rescale register (ignore model tone ranges <= 3 semitones)
	newRegister = (maximumModelFzero > 0) ? maximumRecFzero / maximumModelFzero * register : register;
	newToneRange = (modelPitchRange > 1/toneRules_threeSemit) ? recPitchRange / modelPitchRange : 1;

	// Advanced speakers must not speak too High, or too "Dramatic"
	// Beginning speakers also not too Low or too Narrow ranges
	var registerUsed = "OK";
	var rangeUsed = "OK";
	if (newRegister > highBoundaryFactor * register) {
	   newRegister = highBoundaryFactor * register;
	   registerUsed = "High"
	} else if ( proficiency < 3 && newRegister < lowBoundaryFactor * register) {
	   newRegister = lowBoundaryFactor * register;
	   registerUsed = "Low"
	};

	if (newToneRange > highBoundaryFactor) {
	   newToneRange = highBoundaryFactor
	   rangeUsed = "Wide"
	} else if (proficiency < 3 && newToneRange < lowBoundaryFactor) {
		//Don't do this for advanced speakers
		newToneRange = lowBoundaryFactor;
		rangeUsed = "Narrow";
	};
	
	// Duration 
	if (modelDuration > spacing) {
	   speedFactor = (speechDuration - spacing) / (modelDuration - spacing)
	};

	// Round values
	newRegister = Math.round(newRegister);

	// Remove all pitch points outside a band around the newRegister
	var upperCutOff = 1.5*newRegister;
	var lowerCutOff = newRegister/3;	

	for (var i=0; i < pitchTier.size; ++i) {
		var item = pitchTier.item(i);
		if(item.value > upperCutOff || item.value < lowerCutOff) {
			item.value = 0;
			pitchTier.writeItem(i, item);
		};
	};
	
	// Do the tone recognition
	// Step through longer words
	var syllableCount = numSyllables (pinyin);
	var choiceReference = pinyin;
	var skipSyllables = 0;
	while (choiceReference == pinyin && skipSyllables+1 < Math.max(syllableCount,2)) {
		var result = freeToneRecognition(pitchTier, choiceReference, newRegister, newToneRange, speedFactor, proficiency, skipSyllables);
		skipSyllables += 1
		choiceReference = result.pinyin;
	};
	// Get rid of odd symbols
	choiceReference = choiceReference.replace(/9/g, "3");
	
	// Special cases (frequent recognition errors)
	// Not ultra strict and wrong
	//
	// !!! Add rules for 3[12] to 30 confusions, 00 misidentification !!!
	if (proficiency < 3 && choiceReference != pinyin) {
		var currentPinyin = choiceReference;
		
    	// [23]3 is often misidentified as 23, 20 or 30
    	var matchedFragmentList = pinyin.match(/[23][^0-9]+3/g);
    	while (matchedFragmentList && matchedFragmentList.length > 0) {
			var matchedFragment = matchedFragmentList.shift();
			var matchedSyllable = matchedFragment.replace(/[23]/g, "");
			currentPinyin = currentPinyin.replace(new RegExp("[23]"+matchedSyllable+"[023]", 'g'), matchedFragment)
		};
    	
    	// First syllable: 2<->3 exchanges
    	// 3 => 2
     	var matchedFragmentList = pinyin.match(/[^[^0-9]+2/g);
    	while (matchedFragmentList && matchedFragmentList.length > 0) {
			var matchedFragment = matchedFragmentList.shift();
			var matchedSyllable = matchedFragment.replace(/[23]/g, "");
			currentPinyin = currentPinyin.replace(new RegExp("^"+matchedSyllable+"[3]", 'g'), matchedFragment)
		};
    	// 2 => 3
     	var matchedFragmentList = pinyin.match(/[^[^0-9]+3/g);
    	while (matchedFragmentList && matchedFragmentList.length > 0) {
			var matchedFragment = matchedFragmentList.shift();
			var matchedSyllable = matchedFragment.replace(/[23]/g, "");
			currentPinyin = currentPinyin.replace(new RegExp("^"+matchedSyllable+"[2]", 'g'), matchedFragment)
		};
		
    	// A single second tone is often misidentified as a neutral tone, 
    	// A real neutral tone would be too low or too narrow and be discarded
    	// 0 => 2
     	var matchedFragmentList = pinyin.match(/^[^0-9]+2$/g);
    	while (matchedFragmentList && matchedFragmentList.length > 0) {
			var matchedFragment = matchedFragmentList.shift();
			var matchedSyllable = matchedFragment.replace(/[2]/g, "");
			if (recordedMinMax.tmin < recordedMinMax.tmax) {
				currentPinyin = currentPinyin.replace(new RegExp("^"+matchedSyllable+"[0]", 'g'), matchedFragment);
			};
		};
		
    	// A single fourth tone is often misidentified as a neutral tone, 
    	// A real neutral tone would be too low or too narrow and be discarded
     	// 0 => 4
    	var matchedFragmentList = pinyin.match(/^[^0-9]+4$/g);
    	while (matchedFragmentList && matchedFragmentList.length > 0) {
			var matchedFragment = matchedFragmentList.shift();
			var matchedSyllable = matchedFragment.replace(/[4]/g, "");
			if (recordedMinMax.tmax < recordedMinMax.tmin) {
				currentPinyin = currentPinyin.replace(new RegExp("^"+matchedSyllable+"[0]", 'g'), matchedFragment);
			};
		};
		
    	// 40 <-> 42
    	// A recognized 0 after a 4 can be a 2: 4-0 => 4-2
     	var matchedFragmentList = pinyin.match(/4[^0-9]+2/g);
    	while (matchedFragmentList && matchedFragmentList.length > 0) {
			var matchedFragment = matchedFragmentList.shift();
			var matchedSyllable = matchedFragment.replace(/[2]/g, "");
			currentPinyin = currentPinyin.replace(new RegExp(matchedSyllable+"[0]", 'g'), matchedFragment);
		};
		
    	// 404 <-> 414
    	// A recognized 0 between two tones 4 can be a 1 404 => 414
      	var matchedFragmentList = pinyin.match(/4[^0-9]+1[^0-9]+4/g);
    	while (matchedFragmentList && matchedFragmentList.length > 0) {
			var matchedFragment = matchedFragmentList.shift();
			var matchedSyllable = matchedFragment.replace(/[1]/g, "0");
			currentPinyin = currentPinyin.replace(new RegExp(matchedSyllable, 'g'), matchedFragment);
		};
		
		// If wrong, then undo all changes
		if(currentPinyin == pinyin) choiceReference = currentPinyin;
	};
	
	labelText = (pinyin == choiceReference) ? "Correct" : "Wrong";

	// Set up response to result
	recognitionText += numbersToTonemarks(choiceReference);
	if (labelText == "Wrong") {
		recognitionText += " ("+toneFeedback_tables[language]["Wrong"]+")";
	};
	if (registerUsed != "OK") {
		feedbackText += toneFeedback_tables[language][registerUsed];
	} else if (rangeUsed != "OK") {
		feedbackText += toneFeedback_tables[language][rangeUsed];
	} else {
		var toneLabel = pinyin.replace(/[^\d]/g, "");
		toneLabel = toneLabel.replace(/^(\d\d).*$/, "$1");
		if (choiceReference.match(/6/)) toneLabel = "6";
		if (labelText == "Wrong") {
			feedbackText = toneFeedback_tables[language]["t"+toneLabel];
		} else {
			feedbackText = toneFeedback_tables[language]["Correct"];
		};
	};
	
	var result = {
		Recognition: recognitionText,
		Feedback: feedbackText,
		Label: labelText,
		Register: registerUsed,
		Range: rangeUsed
	};
	
	return result;
};

// DUMMY PLACEHOLDER
/*
 * Tone recognition is done on two-tone pairs
 * 1 Create all 5*5 tone pairs, a broken third tone (9) if necessary, and a "no-tone" pair (6-6)
 * 2 Create pitch contours for each tone combination
 * 3 Determine the DTW distance between the recorded pitch tier and each of the tone combinations
 * 4 If the Z-transformed distance with the correct tone pair is below a bias thresshold, pick correct
 * 5 If the smallest distance is larger than the thresshold pick the tones with the shortest distance
 * 
 */
function freeToneRecognition(pitchTier, pinyin, register, toneRange, speedFactor, proficiency, skipSyllables) {
    var referenceFrequency = 300;
    var frequencyFactor = register > 0 ? referenceFrequency / register : 1;
	
    // Bias Z-normalized value of the distance difference between smallest and correct
    var biasDistance = 1.1;
	if (proficiency <= 0) { // 0
		biasDistance = 1.7;
	} else if (proficiency <= 1) { // 1
		biasDistance = 1.1;
	} else if (proficiency <= 2) { // 2
		biasDistance = 0.6;
	} else if (proficiency > 2) { // 3
		biasDistance = 0.3;
	};
	
	// Generate reference tone
	var referenceDistance = dtwTones (pitchTier, pinyin, register, toneRange, speedFactor, skipSyllables);
	
	var minDistance = Infinity;
	var choicePinyin = pinyin;
	var countDistance = 0;
	var sumDistance = 0;
	var sumSqrDistance = 0;
	
	// Iterate over all relevant tone combinations
	var syllableCount = numSyllables (pinyin);
	var initToneStart = 1;
	if (skipSyllables > 0 || syllableCount <= 1) initToneStart = 0;
	for (var firstTone = initToneStart; firstTone <= 4; ++firstTone) {
		for (var secondTone = 0; secondTone <= 4; ++secondTone) {
			if (! (firstTone == 3 && secondTone == 3)) {
				var testPinyin = moveTones(pinyin, skipSyllables, firstTone, secondTone);
				var testDistance = dtwTones (pitchTier, testPinyin, register, toneRange, speedFactor, skipSyllables);
				if (testDistance < minDistance) {
					minDistance = testDistance;
					choicePinyin = testPinyin;
				};
	            ++countDistance;
	            sumDistance += testDistance;
	            sumSqrDistance += testDistance*testDistance;
			};
		};
	};

	// If there is a third tone, test broken third tones (9)
	if (pinyin.match(/3/g)) {
		testPinyin = pinyin.replace(/3/g, "9");
		var testDistance = dtwTones (pitchTier, testPinyin, register, toneRange, speedFactor, skipSyllables);
		if (testDistance < minDistance) {
			minDistance = testDistance;
			choicePinyin = testPinyin;
		};
		++countDistance;
		sumDistance += testDistance;
		sumSqrDistance += testDistance*testDistance;
		
	};
	
	// Replace all tones by "no tone", i.e., "6"
	{
		testPinyin = pinyin.replace(/[0-9]/g, "6");
		var testDistance = dtwTones (pitchTier, testPinyin, register, toneRange, speedFactor, skipSyllables);
		if (testDistance < minDistance) {
			minDistance = testDistance;
			choicePinyin = testPinyin;
		};
		++countDistance;
		sumDistance += testDistance;
		sumSqrDistance += testDistance*testDistance;
		
	};
	
    if (countDistance > 1) {
        var meanDistance = sumDistance / countDistance;
        var varDistance = (sumSqrDistance - sumDistance*sumDistance/countDistance)/(countDistance - 1) ;
        var stdDistance = Math.sqrt(varDistance);
        var diffDistance = referenceDistance - minDistance;
        var zDistance = diffDistance/stdDistance;

        if (zDistance < biasDistance) {
            choiceReference = pinyin
            minDistance = referenceDistance
        };
    };
    
	return {distance: minDistance, pinyin: choicePinyin};
}

// Calculate DTW on pitchtiers, create the reference pitchTier
// Use toneRange and speedFactor to adapt the reference pitchTier.
function dtwTones (pitchTier, pinyin, register, toneRange, speedFactor, skipSyllables) {
	var dtw = {distance: 0, path: [], matrix: undefined};
	// USE toneRange and speedFactor !!!
	var currentWord = word2tones (pinyin, register);
	dtw = toDTW (pitchTier, currentWord);
	return dtw.distance;
};

// Create a pinyin word with new tones
function moveTones (pinyin, skipSyllables, firstTone, secondTone) {
	var newPinyin = pinyin;
	var syllableCount = numSyllables (pinyin);
	// replace tones in newPinyin
	if (skipSyllables < syllableCount) {
		var regex = skipSyllables > 0 ? new RegExp("^(([^0-9]+[0-9]){" + (skipSyllables) + "}[^0-9]+)[0-9]", 'g') : new RegExp("^([^0-9]+)[0-9]", 'g');
		newPinyin = newPinyin.replace(regex, "$1"+(firstTone));
	};
	if (skipSyllables+1 < syllableCount) {
		var regex = skipSyllables > 0 ? new RegExp("^(([^0-9]+[0-9]){" + (skipSyllables+1) + "}[^0-9]+)[0-9]", 'g') : new RegExp("^([^0-9]+[0-9][^0-9]+)[0-9]", 'g');
		newPinyin = newPinyin.replace(regex, "$1"+(secondTone));
	};
	return newPinyin;
};

// LOOK UP FUNCTIONALITY OF toneScript AND IMPLEMENT IT SOMEWHERE ELSE!!!
function toneScript (pinyin, register, toneRange, speedFactor, skipSyllables) {
	var currentWord = word2tones (pinyin, register);
	
	return currentWord;
};

// Not everyone add all the zeros for the neutral tones. Here we try to guess where
// they would belong.
function add_missing_neutral_tones (pinyin) {
	// Missing neutral tones
	// Missing last tone
	pinyin = pinyin.replace(/([^0-9])$/g, "$10")
	// Easy cases V [^n]
	pinyin = pinyin.replace(/([euioa]+)([^0-9neuioar])/g, "$10$2")
	// Complex case V r V
	pinyin = pinyin.replace(/([euioa]+)(r[euioa]+)/g, "$10$2")
	// Complex case V r C
	pinyin = pinyin.replace(/([euioa]+r)([^0-9euioa]+)/g, "$10$2")
	// Vng cases
	pinyin = pinyin.replace(/([euioa]+ng)([^0-9])/g, "$10$2")
	// VnC cases C != g
	pinyin = pinyin.replace(/([euioa]+n)([^0-9geuioa])/g, "$10$2")
	// VnV cases -> Maximal onset
	pinyin = pinyin.replace(/([euioa])(n[euioa])/g, "$10$2")
	
	return pinyin;
};
