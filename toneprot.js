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
		syllableToneContour.push({"t": time, "f": startPoint});;
        // Go 1/3 of the duration down
	    time += (voicedDuration)*2/6
		syllableToneContour.push({"t": time, "f": lowestPoint});;

        // voiceless break
       	var delta = time + 0.001
		syllableToneContour[p] = [delta, 0];

        // Go half the duration low
	    time += (voicedDuration)*3/6
	    
       	delta = time - 0.001
 		syllableToneContour[p] = [delta, 0];
       
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
	 * tones. Tone 6 is the Dutch intonation
	 * sqrt(frequencyRange) is the mid point
	 * 
	 */
    var voicedContour = toneRules (topLine, time, lastFrequency, voicedDuration, prevTone, toneSyllable, nextTone);
    currentToneContour = currentToneContour.concat(voicedContour);
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

		points.push({"x": x, "value": value});
	};
	
	pitchTier = {"xmin": 0, "xmax": time, "points": {"size": points.length, "items": points}};
	return pitchTier;
}

// Filter pitchTier to get more realistic joins
function smooth_pitchTier (pitchTier) {
	var prevTime = -1;
	var prevValue = 0;
	var currentTime = -1;
	var currentValue = 0;
	var items = pitchTier.points.items;
	for(var i = 1; i < items.length; i+=1) {
		var nextTime = items[i].x;
		var nextValue = items[i].value;
		
		// Change currentValue as the average of prev, current, and next
		// NOTE: Do not use the changed value for the next round!!!
		if (prevValue > 0 && currentValue > 0 && nextValue > 0) {
			items[i-1].value = (prevValue + currentValue + nextValue) / 3;
		};
		// Next round
		prevTime = currentTime;
		prevValue = currentValue;
		currentTime = nextTime;
		currentValue = nextValue;
	};
};

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
	var items = pitchTier.points.items;
	for(var i = 1; i < items.length; i+=1) {
		var currentTime = items[i].x;
		var currentValue = items[i].value;
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
	var dBpower = (power > 0) ? maxPowerRecorded + Math.log10(power) * 10 : 0;
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

function draw_tone (id, color, typedArray, sampleRate, duration) {
	var fMin = 75;
	var fMax = 600;
	var dT = 0.01;
	var topLine = getRegister();

	var pitch = calculate_Pitch (typedArray, sampleRate, fMin, fMax, dT);
	var points = [];
	for (var i=0; i < pitch.length; ++ i) {
		points.push({"x": i*dT, "value": pitch [i] });
	};
	pitchTier = {"xmin": 0, "xmax": duration, "points": {"size": points.length, "items": points}};
	plot_pitchTier (id, color, 4, topLine, pitchTier);
	
	return pitchTier;
}

// Pitch trackers 

function testPitchTracker (duration, sampleRate) {
	// Create a sound buffer
	var audioCtx = new AudioContext();
	var audioBuffer = audioCtx.createBuffer(1, duration*sampleRate, sampleRate);
	var audioRecording = audioBuffer.getChannelData(0);
	
	// Do something with the recorded blob and the AudioContext.decodeAudioData
	
	// Fill it with a sum of sine waves
	var harmonics = [185];
	var numHarmonics = 10;
	for (var h = 1; h < numHarmonics; ++h) {
		harmonics [h] = h * harmonics [0];
	}; 
	var phase = 2 * Math.PI * Math.random();
	var maxAmp = 0.71;
	// Scale recording to [-1, 1]
	var scale = maxAmp / harmonics.length;
	for (var i = 0; i < duration * sampleRate; ++i) {
		audioRecording [i] = 0.1*Math.random();
		var fm = 1 + 0.1 * Math.sin (2 * Math.PI * i / (duration * sampleRate) + phase);
		for (var h = 0; h < numHarmonics; ++h) {
			audioRecording [i] += scale * Math.sin (2 * Math.PI * i * fm * harmonics [h] / sampleRate);
		};
	};

	// make a PitchTier with 25.6 ms windows, step 10 ms
	var windowDuration = 0.0256;
	var dT = 0.010;
	var windowLength = sampleRate * windowDuration;
	var points = [];
	var t = windowDuration / 2;
	
	// Step through sound
	// Create an audio buffer
	var bufferCtx = new AudioContext();
	var bufBuffer = audioCtx.createBuffer(1, windowLength, sampleRate);
	var buf = audioBuffer.getChannelData(0);
	/* Create a new pitch detector */
	var pitch = new PitchAnalyzer(sampleRate);
	while (t < duration - windowDuration) {
		
		var x = Math.floor(t * sampleRate - windowLength / 2);
		for (var i = 0; i < windowLength; ++i) {
			buf [i] = audioRecording [x + i] // * Math.sin ( Math.PI * i / windowLength) ;
		};
	
		/* Copy samples to the internal buffer */
		pitch.input(buf);
		
		/* Process the current input in the internal buffer */
		pitch.process();
	
		var pitchValue = pitch.findTone();

console.log("x: " + t + ", value: " + pitchValue);
		points.push({"x": t, "value": (pitchValue ? pitchValue.freq : 0)});

		t += dT;
	};
	
	pitchTier = {"xmin": 0, "xmax": duration, "points": {"size": points.length, "items": points}};
	return pitchTier;
}

var recognition = {
		Recognition: "",
		Feedback: "",
		Label: "Correct",
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
			recordedPitchTier = draw_tone ("TonePlot", "red", recordedArray, recordedSampleRate, recordedDuration)
		};
		recognition = sgc_ToneProt (pitchTier, currentPinyin, sgc3_settings.register, sgc3_settings.strict, sgc3_settings.language);
	
		// Write results
		document.getElementById("ResultString").textContent = recognition.Recognition;
		document.getElementById("ResultString").style.color = (recognition.Label == "Correct") ? "green" : "red";
		document.getElementById("FeedbackString").textContent = recognition.Feedback;
		document.getElementById("FeedbackString").style.color = (recognition.Label == "Correct") ? "green" : "red";
	};
};

// Tone recogition

function sgc_ToneProt (pitchTier, pinyin, register, proficiency, language) {
	var recognitionText = numbersToTonemarks(pinyin)+": ";
	var feedbackText = "";
	var labelText = "";
	
	var pitchPercentiles = get_percentiles (pitchTier.points.items, function (a, b) { return a.value-b.value;}, function(a) { return a.value <= 0;}, [5, 50, 95]);
	
	recognitionText += numbersToTonemarks(pinyin);
	if (labelText == "Wrong") recognitionText += " ("+toneFeedback_tables[language]["Wrong"]+")";
	var toneLabel = pinyin.replace(/[^\d]/g, "");
	toneLabel = toneLabel.replace(/^(\d\d).*$/, "$1");
	feedbackText = toneFeedback_tables[language]["t"+toneLabel];
	
	labelText = "Wrong";
	
	var result = {
		Recognition: recognitionText,
		Feedback: feedbackText,
		Label: labelText,
	};
	
	return result;
};
