/* 
 * audioProcessing.js
 * 
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

var mimeTypes = {
	"wav": "audio/wav",
	"mp3": "audio/mpeg",
	"flac": "audio/flac",
	"ogg": "audio/ogg",
	"spx": "audio/ogg",
	"aif": "audio/aifc",
	"tsv": "text/tsv",
	"csv": "text/csv"
};
// Global variables
var recordedBlob, recordedBlobURL;
var recordedArray;
var recordedDuration;
var recordedPitchTier;
var windowStart = windowEnd = 0;
var recordedSampleRate = 0;
var currentAudioWindow = undefined;
var audioDatabaseName = "Audio";
var examplesDatabaseName = "Examples";

var clearRecording = function () { 
	recordedBlob = undefined;
	recordedBlobURL = undefined;
	recordedArray = undefined;
	currentAudioWindow = undefined;
	recordedSampleRate = recordedDuration = undefined;
	recordedPitchTier = undefined;
};

/*
 * 
 * Audio processing code
 * 
 */
 
// Only initialize ONCE
var audioContext = new AudioContext();
 
// Decode the audio blob
var audioProcessing_decodedArray;
function processAudio (blob) {
	var audioReader = new FileReader();
	audioReader.onload = function(){
		var arrayBuffer = audioReader.result;
		audioContext.decodeAudioData(arrayBuffer, decodedDone);
	};
	audioReader.readAsArrayBuffer(blob);
};

// You need a function "processRecordedSound ()"
// Set some switches to prevent stored data are reused
sessionStorage["recorded"] = "false";
var retrievedData = false;
function decodedDone(decoded) {
	var typedArray = new Float32Array(decoded.length);
	typedArray = decoded.getChannelData(0);
	var currentArray = typedArray;
	recordedSampleRate = decoded.sampleRate;
	recordedDuration = decoded.duration;
	var length = decoded.length;
	
	// Process and draw audio
	recordedArray = cut_silent_margins (currentArray, recordedSampleRate);
	currentAudioWindow = recordedArray;
	recordedDuration = recordedArray.length / recordedSampleRate;
	windowStart = 0;
	windowEnd = recordedDuration;

	// make sure this function is defined!!!
	if (!retrievedData) sessionStorage["recorded"] = "true";
	processRecordedSound ();
	sessionStorage["recorded"] = "false";
	// Note this one should be switched AFTER processRecordedSound has been called.
	retrievedData = false;
};

function play_soundArray (soundArray, sampleRate, start, end) {
	var startSample = start > 0 ? Math.floor(start * sampleRate) : 0;
	var endSample = end > 0 ? Math.ceil(end * sampleRate) : soundArray.length;
	if (startSample > soundArray.length || endSample > soundArray.length) {
		startSample = 0;
		endSample = soundArray.length;
	};
	var soundBuffer = audioContext.createBuffer(1, endSample - startSample, sampleRate);
	var buffer = soundBuffer.getChannelData(0);
	for (var i = 0; i < (endSample - startSample); i++) {
	     buffer[i] = soundArray[startSample + i];
	};

	// Get an AudioBufferSourceNode.
	// This is the AudioNode to use when we want to play an AudioBuffer
	var source = audioContext.createBufferSource();
	// set the buffer in the AudioBufferSourceNode
	source.buffer = soundBuffer;
	// connect the AudioBufferSourceNode to the
	// destination so we can hear the sound
	source.connect(audioContext.destination);
	// start the source playing
	source.start();
};

/*
 * Convert typed mono array to WAV blob
 * 
 */
function writeUTFBytes(view, offset, string){ 
  var lng = string.length;
  for (var i = 0; i < lng; i++){
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

// Write selection [start, end] to a WAV blob
function arrayToBlob (array, start, end, sampleRate) {
	if(!array) return;
	if(end <= 0) end = array.length;
	var window = array.slice(start*sampleRate, end*sampleRate);

	// create the buffer and view to create the .WAV file
	var buffer = new ArrayBuffer(44 + window.length * 2);
	var view = new DataView(buffer);

	// write the WAV container, check spec at: https://ccrma.stanford.edu/courses/422/projects/WaveFormat/
	// RIFF chunk descriptor
	writeUTFBytes(view, 0, 'RIFF');
	view.setUint32(4, 44 + window.length * 2, true);
	writeUTFBytes(view, 8, 'WAVE');
	// FMT sub-chunk
	writeUTFBytes(view, 12, 'fmt ');
	view.setUint32(16, 16, true);
	view.setUint16(20, 1, true);
	// mono (2 channels)
	view.setUint16(22, 1, true);
	view.setUint32(24, sampleRate, true);
	view.setUint32(28, sampleRate * 2, true);
	view.setUint16(32, 2, true);
	view.setUint16(34, 16, true);
	// data sub-chunk
	writeUTFBytes(view, 36, 'data');
	view.setUint32(40, window.length * 2, true);

	// write the PCM samples
	var lng = window.length;
	var index = 44;
	var volume = 1;
	for (var i = 0; i < lng; i++){
	    view.setInt16(index, window[i] * (0x7FFF * volume), true);
	    index += 2;
	}
	
	// our final binary blob that we can hand off
	var blob = new Blob ( [ view ], { type : 'audio/wav' } );
	
	return blob;
};

// Set up window 
function setupGaussWindow (sampleRate, fMin) {
	var lagMax = (fMin > 0) ? 1/fMin : 1/75;
	var windowDuration = lagMax * 6;
	var windowSigma = 1/6;
	var window = new Float32Array(windowDuration * sampleRate);
	var windowCenter = (windowDuration * sampleRate -1) / 2;
	for (var i = 0; i < windowDuration * sampleRate; ++i) {
		var exponent = -0.5 * Math.pow( (i - windowCenter)/(windowSigma * windowCenter), 2);
		window [i] = Math.exp(exponent);
	};
	
	return window;
};

function getWindowRMS (window) {
	var windowSumSq = 0;
	var windowRMS = 0;
	if (window && window.length > 0) {
		for (var i = 0; i < window.length; ++i) {
			windowSumSq += window [i]*window [i];
		};
		windowRMS = Math.sqrt(windowSumSq/window.length);
	};
	
	return windowRMS;
};

// Cut off the silent margins
// ISSUE: After the first recording, there is a piece at the start missing.
// This is now cut off
function cut_silent_margins (typedArray, sampleRate) {
	// Find part with sound
	var silentMargin = 0.1;
	// Silence thresshold is -20 dB
	var thressHoldDb = 25;
	// Stepsize
	var dT = 0.01;
	var soundLength = typedArray.length;

	// There is sometimes (often) a delay before recording is started
	var firstNonZero = 0;
	while (firstNonZero < typedArray.length && (isNaN(typedArray[firstNonZero]) || typedArray[firstNonZero] == 0)) {
		++firstNonZero
	};
	
	// Calculation intensity
	var currentIntensity = calculate_Intensity (typedArray, sampleRate, 75, 600, 0.01);
	var maxInt = Math.max.apply(Math, currentIntensity);
	var silenceThresshold = maxInt - thressHoldDb;

	var firstFrame = 0;
	while (firstFrame < currentIntensity.length && currentIntensity[firstFrame] < silenceThresshold) {
		++firstFrame;
	};
	
	var lastFrame = currentIntensity.length - 1;
	while (lastFrame > 0 && currentIntensity[lastFrame] < silenceThresshold) {
		--lastFrame;
	};

	if ((firstFrame >= currentIntensity.length - silentMargin/dT) || (lastFrame <= silentMargin/dT) || lastFrame <= firstFrame) {
		firstFrame = 0;
		lastFrame = currentIntensity.length - 1;
	};
	
	// Convert frames to samples
	var firstSample = (firstFrame * dT - silentMargin) * sampleRate;
	var lastSample = ((lastFrame + 1) * dT + silentMargin) * sampleRate;
	if (firstSample < 0) firstSample = 0;
	// Remove non-recorded part froms tart
	if (firstSample < firstNonZero) firstSample = firstNonZero;
	if (lastSample >= soundLength) lastSample = soundLength - 1;

	var newLength = Math.ceil(lastSample - firstSample);
	var soundArray = new Float32Array(newLength);
	for (var i = 0; i < newLength; ++i) {
		// Also, get rid of NaN's
		soundArray [i] = !isNaN(typedArray[firstSample + i]) ? typedArray[firstSample + i] : 0;
	};
	return soundArray;
};

// Calculate autocorrelation in a window (array!!!) around time
// You should divide the result by the autocorrelation of the window!!!
//
// David Weenink: De autocorrelatie moet gecontroleerd worden.
// Ik denk niet dat hij veel sneller kan.
function autocorrelation (sound, sampleRate, time, window) {
	// Calculate FFT
	// This is stil just the power in dB.
	var soundLength = sound.length;
	var windowLength = (window) ? window.length : soundLength;
	var FFT_N = Math.pow(2, Math.ceil(Math.log2(windowLength))) * 2;
	var input = new Float32Array(FFT_N * 2);
	var output = new Float32Array(FFT_N * 2);
	// The window can get outside of the sound itself
	var offset = Math.floor(time * sampleRate - Math.ceil(windowLength/2));
	if (window) {
		for (var i = 0; i < FFT_N; ++i) {
			input [2*i] = (i < windowLength && (offset + i) > 0 && (offset + i) < soundLength) ? sound [offset + i] * window [i] : 0;
			input [2*i + 1] = 0;
		};
	} else {
		for (var i = 0; i < FFT_N; ++i) {
			input [2*i] = (i < windowLength && (offset + i) > 0 && (offset + i) < soundLength) ? sound [offset + i] : 0;
			input [2*i + 1] = 0;
		};
	};
	var fft = new FFT.complex(FFT_N, false);
	var ifft = new FFT.complex(FFT_N, true);
	fft.simple(output, input, 1)

	// Calculate H * H(cj)
	// Scale per frequency
	for(var i = 0; i < FFT_N; ++ i) {
		var squareValue = (output[2*i]*output[2*i] + output[2*i+1]*output[2*i+1]);
		input[2*i] = squareValue;
		input[2*i+1] = 0;
		output[2*i] = 0;
		output[2*i+1] = 0;
	};
	
	ifft.simple(output, input, 1);
	
	var autocorr = new Float32Array(FFT_N);
	for(var i = 0; i < FFT_N; ++ i) {
		 autocorr[i] = output[2*i] / windowLength;
	};

	return autocorr;
};

/*
 * 
 * David Weenink, here are the pitch routines:
 * - Autocorrelation peak picking for candidates
 * - Pitch tracking for selecting the best candidate
 * 
 */

// Take a spectrum and return a list with peaks
//
// David Weenink: De peak picker moet geoptimaliseerd worden.
// liefst met een "echt" peak picking algoritme. Dit is een simplistische
// 5 punts differentiatie (4 verschillen) die halverwege door nul gaan
// dwz, twee verschillen > 0 gevolgd door twee verschillen < 0.
// Ik gebruik nu een 3 punts parabool om het maximum te vinden, 
// maar ik vermoed dat een 5 punts kwadratische fit misschien beter is?
function autocorrelationPeakPicker (autocorr, sampleRate, fMin, fMax) {
	var thressHold = 0.001;
	var resultArray = [];
	// Find the pitch candidates
	var lagMin = (fMax > 0) ? 1/fMax : 1/600;
	var lagMax = (fMin > 0) ? 1/fMin : 1/60;
	var startLag = Math.floor(lagMin * sampleRate);
	var endLag = Math.ceil(lagMax * sampleRate);
	var bestLag = 0;
	var bestAmp = -100;
	// 5 point differentiation
	var diffAmp = [];
	var halfLength = 2;
	for (var i=-halfLength; i<halfLength; ++i){
		diffAmp[i+halfLength] = autocorr [startLag+i+1] - autocorr [startLag+i];
	};
	var peaks = [];
	for (var j = startLag; j <= endLag; ++j) {
		for (var i=0;  i< diffAmp.length-1; ++i){
			diffAmp[i] = diffAmp[i+1];
		};
		diffAmp[diffAmp.length-1] = autocorr [j+halfLength] - autocorr [j+halfLength-1];
		// A peak is found
		if(autocorr [j] > thressHold && diffAmp[0] > 0 && diffAmp[1] > 0 && diffAmp[2] <= 0 && diffAmp[3] <= 0) {
			// 4 point linear regression with zero-crossing centered around 0
			var linReg = linearRegression(diffAmp, [-1.5, -0.5, 0.5, 1.5]);
			var offset =  - linReg.intercept/linReg.slope;
			var zeroCrossing = j + offset;
			// Get the maximum using a 3-point quadratic interpolation. 
			// I would prefer a 5-point least RMSE quadratic fit
			var pC = threePointParabola ([autocorr [j-1], autocorr [j], autocorr [j+1]], [-1, 0, 1]);
			var maxValue = pC.a * offset*offset + pC.b*offset + pC.c;
			peaks.push({x: sampleRate/zeroCrossing, y: maxValue});
		};
	};
	// Switch to low to high ordering
	peaks.reverse();
	return peaks;
};

// Return a list of points with {t, candidates} "pairs"
function calculate_Pitch (sound, sampleRate, fMin, fMax, dT) {
	var duration = sound.length / sampleRate;
	var pitchArray = [];
	
	// Set up window and calculate Autocorrelation of window
	var windowDuration = (fMin > 0) ? 1/fMin : 1/60;
	windowDuration *= 6;
	var window = setupGaussWindow (sampleRate, fMin);
	var windowRMS = getWindowRMS (window);

	// calculate the autocorrelation of the window
	var windowAutocorr = autocorrelation (window, sampleRate, windowDuration / 2, 0);
	
	// Step through the sound
	for (var t = 0; t < duration; t += dT) {
		var autocorr = autocorrelation (sound, sampleRate, t, window);
		for (var i = 0; i < autocorr.length; ++i) {
			autocorr [i] /= (windowAutocorr [i]) ? (windowAutocorr [i] * windowRMS) : 0;
		};
		
		// Find the pitch candidates
		var pitchCandidates = autocorrelationPeakPicker (autocorr, sampleRate, fMin, fMax);
		// unvoiced
		if(pitchCandidates.length == 0)pitchCandidates.push({x:0, y:0});
		pitchArray.push({x: t, values: pitchCandidates});
	};
	return pitchArray;
};

// PitchTier definition
function Tier () {
	// data
	this.xmin = Infinity;
	this.xmax = -Infinity;
	this.valuemin = Infinity;
	this.valuemax = -Infinity;
	this.dT = undefined;
	this.size = undefined;
	this.time = [];
	this.values = [];
	
	// access functions
	this.valueSeries = function () {return this.values; };
	this.timeSeries = function () {return this.time; };
	this.item = function (i) {
		return {x: this.time [i], value: this.values [i]};
	};
	this.writeItem = function (i, item) {
		if ( i < this.time.length ) {
			this.time [i] = item.x;
			if(item.x < this.xmin)this.xmin = item.x;
			if(item.x > this.xmax)this.xmax = item.x;
			this.values [i] = item.value;
			if(item.value < this.valuemin) this.valuemin = item.value;
			if(item.value > this.valuemax) this.valuemax = item.value;
			return i;
		} else {
			console.log("Item "+i+" does not exist");
			return false;
		}
	};
	this.pushItem = function (item) {
		this.time.push(item.x);
		if(item.x < this.xmin)this.xmin = item.x;
		if(item.x > this.xmax)this.xmax = item.x;
		this.values.push(item.value);
		if(item.value < this.valuemin) this.valuemin = item.value;
		if(item.value > this.valuemax) this.valuemax = item.value;
		this.size = this.time.length;
		return this.size;
	};
};

// Pitch tracking and candidate selection
function toPitchTier (sound, sampleRate, fMin, fMax, dT) {
	var pitchArray = calculate_Pitch (sound, sampleRate, fMin, fMax, dT);
	var duration = sampleRate > 0 ? sound.length / sampleRate : 0;
	var points = [];
	var timeSeries = [];
	var valueSeries = [];
	
	// Select the best pitch candidates using tracking etc.
	var bestTrack = viterbi (pitchArray);
	
	var pitchTier = new Tier();
	pitchTier.xmin = 0;
	pitchTier.dT = dT;
	for (var i=0; i < pitchArray.length; ++ i) {
		var bestValue = pitchArray[i].values[bestTrack[i]].x;
		pitchTier.pushItem ({x: pitchArray [i].x, value: bestValue});
	};
	
	return pitchTier;
}

// Viterbi pitch tracking
// Takes an array of pitch candidates and returns a list of 
// the best candidate for each frame
//
// David Weenink: 
// Deze viterbi functie moet versneld en geoptimaliseerd worden.
// De kostenfunctie is nu willekeurig gekozen.
function viterbi (pitchArray) {
	var costsList = [];
	var backpointerList = [];
	for (var i=0; i < pitchArray.length; ++i) {
		var sumWeights = 0;
		var pitchCandidates = pitchArray[i].values;
		var prevCandidates = pitchArray[i-1] && pitchArray[i-1].values ? pitchArray[i-1].values : [{x:0, y:0}];
		var previousCosts = i>0 ? costsList[i-1] : [0];
		var candidateCosts = [];
		var candidateBackpointers = [];
		// Initialize variables
		for (var j=0; j <pitchCandidates.length; ++j) {
			sumWeights += pitchCandidates[j].y;
			candidateCosts.push(0);
			candidateBackpointers.push(-1);
		};
		// Find best continuation for each candidate
		for (var j=0; j <pitchCandidates.length; ++j) {
			weight = sumWeights > 0 ? 1 - (pitchCandidates[j].y / sumWeights) : 1;
			// Initialize to handle voiceless previous frame
			minCost = Infinity;
			bestBackpointer = 0;
			// The cost function is distance^2 / relative height of peak
			for (var k=0; k<prevCandidates.length; ++k) {
				// Previous costs of this precurser
				var newCost = previousCosts[k];
				// Cost added
				if(prevCandidates[k].x > 0 && pitchCandidates[j].x > 0) {
					// Squared difference relative to average between points.
					newCost += weight * Math.pow(2*(prevCandidates[k].x - pitchCandidates[j].x)/(prevCandidates[k].x + pitchCandidates[j].x), 2);
				} else {
					newCost += weight;
				};
				if(newCost < minCost) {
					minCost = newCost;
					bestBackpointer = k;
				};
			};
			candidateCosts[j] = minCost;
			candidateBackpointers[j] = bestBackpointer;
		};
		costsList.push(candidateCosts);
		backpointerList.push(candidateBackpointers);
	};
	// Trace back best pitch track
	var lastItem = costsList.length - 1;
	var costsCandidates = costsList[lastItem];
	var minCost = costsCandidates[0];
	var endPoint = 0;
	// Get the end point with the lowest cost
	for (j=1; j<costsCandidates.length; ++j) {
		if(costsCandidates[j] < minCost) {
			minCost = costsCandidates[j];
			endPoint = j;
		};
	};
	var resultTrack = [endPoint];
	var lastBackpointer = endPoint;
	for (var i=backpointerList.length - 1; i>0; --i) {
		lastBackpointer = backpointerList[i][lastBackpointer];
		resultTrack.push(lastBackpointer);
	};
	
	// The result track is reversed
	return resultTrack.reverse();
};


// DTW between two pitchTiers
//
// David Weenink:
// Dit is de DTW functie. Die moet geoptimaliseerd en versneld worden
// De kosten (inclusief voor voicing sprongen) zijn nu willekeurig gekozen
function toDTW (pitchTier1, pitchTier2) {
	var horCost = 2;
	var verCost = 2;
	var diagonalCost = 1;
	var voicingCost = 100;
	var dtw = {distance: 0, path: [], matrix: undefined};
	var costMatrix = [];
	var backpointerMatrix = [];
	
	var pitch1 = pitchTier1.valueSeries();
	var pitch2 = pitchTier2.valueSeries();
	
	// Initialize the cost and backpointer matrices
	for (var i=0; i<pitch1.length; ++i) {
		var costColumn = [];
		var bpColumn = [];
		for (var j=0; j<pitch2.length; ++j) {
			costColumn.push(0);
			bpColumn.push(0);
		};
		costMatrix.push(costColumn);
		backpointerMatrix.push(bpColumn);
	};

	// Fill the cost and backpointer matrices
	// i = pitch1
	// j = pitch2
	for (var i=0; i<pitch1.length; ++i) {
		for (var j=0; j<pitch2.length; ++j) {
			var newCost = 0;
			// backpointer [i-1][j]=-1, [i][j-1]=1, [i-1][j-1]=0
			var backpointer = 0;
			if(j > 0) {
				if(i > 0) {
					var newHorCost = costMatrix[i-1][j] + horCost * dtwCostFunction(pitch1[i-1], pitch2[j], voicingCost);
					var newVerCost = costMatrix[i][j-1] + verCost * dtwCostFunction(pitch1[i], pitch2[j-1], voicingCost);
					var newDiaCost = costMatrix[i-1][j-1] + diagonalCost * dtwCostFunction(pitch1[i-1], pitch2[j-1], voicingCost);
					var minCost = Math.min(newHorCost, newVerCost, newDiaCost);
					if(newDiaCost == minCost) {
						newCost = newDiaCost;
						backpointer = 0;
					} else if (newHorCost == minCost) {
						newCost = newHorCost;
						backpointer = -1;
					} else if (newVerCost == minCost) {
						newCost = newVerCost;
						backpointer = 1;
					} else {
						console.log("ERROR: No DTW cost");
					};
				} else {
					// i == 0
					newCost = costMatrix[0][j-1];
					newCost += horCost * dtwCostFunction(pitch1[0], pitch2[j], voicingCost);
					backpointer = 1;
				};
			} else if (i > 0) {
				// j == 0
				newCost = costMatrix[i-1][0];
				newCost += horCost * dtwCostFunction(pitch1[i], pitch2[0], voicingCost);
				backpointer = -1;
			} else {
				// i == 0 and j == 0, corner case
				newCost = 0;
				newCost += horCost * dtwCostFunction(pitch1[0], pitch2[0], voicingCost);
				backpointer = 0;
			};
			costMatrix[i][j] = newCost;
			backpointerMatrix[i][j] = backpointer;
		};
	};
	dtw.matrix = costMatrix;
	
	// Start at upper right corner and trace back the path
	var i = pitch1.length-1;
	var j = pitch2.length-1;
	dtw.distance = costMatrix[i][j];
	
	var path = [];
	while (i > 0 || j > 0) {
		path.push({i: i, j: j});
		var step = backpointerMatrix[i][j];
		if(step == 0) {
			i -= 1;
			j -= 1;
		} else if (step == -1) {
			i -= 1;
		} else if (step == 1) {
			j -= 1;
		} else {
			console.log("ERROR: wrong step");
			return [];
		};
	};
	path.push({i: 0, j: 0});
	dtw.path = path.reverse();
	
	return dtw;
};


// David Weenink:
// Dit is de DTW kostenfunctie. hier kan een betere ingevoerd worden.
// Deze is nu willekeurig gekozen
function dtwCostFunction (value1, value2, voicingCost) {
	if(value1 > 0 && value2 > 0)return Math.pow(value1-value2, 2);
	if(value1 == 0 && value2 == 0)return 0;
	if(value1 == 0 || value2 == 0)return Math.pow(voicingCost, 2);
};

// Calculate the (RMS) power in a time window
function getPower (sound, sampleRate, time, window) {
	var soundLength = sound.length;
	var duration = sound.length / sampleRate;
	var windowLength = (window) ? window.length : soundLength;
	var sumSquare = 0;
	var windowSUM = 0;
	// The window can get outside of the sound itself
	var offset = Math.floor(time * sampleRate - Math.ceil(windowLength/2));
	if (window) {
		for (var i = 0; i < windowLength; ++i) {
			var value = ((offset + i) > 0 && (offset + i) < soundLength) ? sound [offset + i] * window [i] : 0;
			sumSquare += value*value;
			windowSUM += window [i]*window [i];
		};
	} else {
		for (var i = 0; i < windowLength; ++i) {
			var value = ((offset + i) > 0 && (offset + i) < soundLength) ? sound [offset + i] : 0;
			sumSquare += value*value;
			windowSUM += 1;
		};
	};

	if (windowSUM <= 0) windowSUM = 1;
	var power = sumSquare / windowSUM;
	return power;
};

function calculate_Intensity (sound, sampleRate, fMin, fMax, dT) {
	var duration = sound.length / sampleRate;
	var bitSize = 16;
	var maxPower = Math.round(20*Math.log10(Math.pow(2,bitSize-1)));
	var quantNoise = Math.round(20*Math.log10(0.5));
	var dynamicRange = maxPower - quantNoise;
	var lagMin = (fMax > 0) ? 1/fMax : 1/600;
	var lagMax = (fMin > 0) ? 1/fMin : 1/60;
	var intensity = new Float32Array(Math.floor(duration / dT));
	
	// Set up window
	var windowDuration = lagMax * 6;
	var window = setupGaussWindow (sampleRate, fMin);
	
	// Step through the sound
	var i = 0;
	for (var t = 0; t < duration; t += dT) {
		var power = getPower (sound, sampleRate, t, window);
		var powerdB = (power > 0) ? dynamicRange + Math.log10(power) * 10 : 0;
		if (i < intensity.length) intensity [i] = powerdB;
		++i;
	};
		
	return intensity;
};


// load the sound from a URL
function load_audio(url) {
	var request = new XMLHttpRequest();
	request.open('GET', url, true);
	request.responseType = 'arraybuffer';
	// When loaded decode the data and store the audio buffer in memory
	request.onload = function() {
		processAudio (request.response);
	}
	request.send();
}

/*
 * 
 * Use: var perc = get_percentiles (points, function (a, b) { return a.value-b.value;}, function(a) { return a.value <= 0;}, [0.05, 0.50, 0.95]);
 * 
 */
function get_percentiles (points, compare, remove, percentiles) {
	var sortList = points.slice();
	var ax;
	while (sortList.length > 0 && (ax = sortList.indexOf(undefined)) !== -1) {
            sortList.splice(ax, 1);
    }
	var result = [];
	sortList.sort(compare);
	var sortListLength = sortList.length
	for (var i = sortListLength-1; i >= 0; --i) {
		if (remove(sortList[i])) {
			sortList.splice(i, 1);
		};
	};
	for (var i = 0; i < percentiles.length; ++i) {
		var perc = percentiles[i];
		if (perc > 1) perc /= 100;
		var newPercentile = {value: undefined, percentile: 0};
		var bin = Math.ceil(perc * sortList.length) - 1;
		bin = bin < 0 ? 0 : (bin >= sortList.length ? sortList.length : bin);
		newPercentile.value = sortList[bin];
		newPercentile.percentile = percentiles[i];
		result.push(newPercentile)
	};
	return result;
};

// return the minim and maximum and their times
function get_time_of_minmax (tier) {
	var min = Infinity;
	var max = -Infinity;
	var tmin = tmax = 0;
	for (var i = 0; i < tier.size; ++i) {
		var item = tier.item(i);
		var currentValue = item.value;
		var currentTime = item.x;
		if (currentValue < min) {
			min = currentValue;
			tmin = currentTime;
		};
		if (currentValue > max) {
			max = currentValue;
			tmax = currentTime;
		};
	};
	return {min: min, max: max, tmin: tmin, tmax: tmax};
};

/*
 * 
 * Use IndexedDB as a store for audio "files"
 * 
 */
 
// Use IndexedDB as an Audio storage
function saveCurrentAudioWindow (collection, map, fileName) {
	if (!currentAudioWindow || currentAudioWindow.length <= 0 || ! recordedSampleRate || recordedSampleRate <= 0) return;
	var blob = arrayToBlob (currentAudioWindow, 0, 0, recordedSampleRate);
	if (collection && collection.length > 0 && map && map.length > 0 && fileName && fileName.length > 0) {
		addAudioBlob(collection, map, fileName, blob);
	};
};

var indexedDBversion = 2;
function getCurrentAudioWindow (collection, map, name) {
	var request = indexedDB.open(audioDatabaseName, indexedDBversion);
	request.onerror = function(event) {
	  alert("Use of IndexedDB not allowed");
	};
	request.onsuccess = function(event) {
		db = this.result;
		var key = (map.length > 0) ? collection+"/"+map+"/"+name : collection+"/"+name;
		var request = db.transaction(["Recordings"], "readwrite")
			.objectStore("Recordings")
			.get(key);
		
		request.onsuccess = function(event) {
			var record = this.result;
			if(record) {
				if(record.audio){
					// processAudio is resolved asynchronously, reset retrievedData when it is finished
					retrievedData = true;
					processAudio (record.audio);
				};
			};
		};
		
		// Data not found
		request.onerror = function(event) {
			console.log("Unable to retrieve data: "+map+"/"+name+" cannot be found");
		};
		
	};
	request.onerror = function(event) {
		console.log("Error: ", event);
	}
	request.onupgradeneeded = function(event) {
		var db = this.result;
		// Create an objectStore to hold audio blobs.
		initializeObjectStore (db, collection);
	};
};

function getAndPlayExample (wordlist, name, playBlob, otherPlay) {
	var request = indexedDB.open(examplesDatabaseName, indexedDBversion);
	request.onerror = function(event) {
	  alert("Use of IndexedDB not allowed");
	};
	request.onsuccess = function(event) {
		db = this.result;
		var key = "Wordlists"+"/"+wordlist+"/"+name;
		var request = db.transaction(["Recordings"], "readwrite")
			.objectStore("Recordings")
			.get(key);
		
		request.onsuccess = function(event) {
			var record = this.result;
			if(record) {
				if(record.audio){
					// playBlob is run asychronously
					playBlob(record.audio);
				};
			};
			if((!record || !record.audio) && otherPlay) otherPlay();
		};
		
		// Data not found
		request.onerror = function(event) {
			if(otherPlay) otherPlay();
			console.log("Unable to retrieve data: "+map+"/"+name+" cannot be found");
		};
		
	};
	request.onerror = function(event) {
		console.log("Error: ", event);
	}
	request.onupgradeneeded = function(event) {
		var db = this.result;
		// Create an objectStore to hold audio blobs.
		initializeObjectStore (db, "Worklists");
	};
};

function getCurrentMetaData (collection, processData) {
	var request = indexedDB.open(audioDatabaseName, indexedDBversion);
	request.onerror = function(event) {
	  alert("Use of IndexedDB not allowed");
	};
	request.onsuccess = function(event) {
		db = this.result;
		var request = db.transaction(["Recordings"], "readwrite")
			.objectStore("Recordings")
			.get(collection+"/"+collection+".tsv");
		
		request.onsuccess = function(event) {
			var record = this.result;
			if(record) {
				if(record.audio){
					// This is a text blob
					if (processData) {
						var objectList = csvblob2objectlist(record.audio, processData);
					};
				};
			} else {
				var date = new Date().toLocaleString();
				var blob = new Blob([''], { type: 'text/tsv', endings: 'native' });
				var customerObjectStore = db.transaction(["Recordings"], "readwrite").objectStore("Recordings");
				var request = customerObjectStore.add({ collection: collection, map: "", name: collection+".tsv", date: date, audio: blob }, collection+"/"+collection+".tsv");
		
				request.onsuccess = function(event) {
					console.log("Success: ", this.result, " ", date);
				};
		
				request.onerror = function(event) {
					console.log("Unable to add data: "+collection+"/"+collection+".tsv"+" cannot be created or updated");
				};		
			};
		};
		
		// Data not found
		request.onerror = function(event) {
			console.log("Unable to retrieve metadata file: "+collection+"/"+collection+".tsv cannot be found");
		};
		
	};
	request.onerror = function(event) {
		console.log("Error: ", event);
	}
	request.onupgradeneeded = function(event) {
		var db = this.result;
		// Create an objectStore to hold audio blobs.
		initializeObjectStore (db, collection);
	};
};

// Create an objectStore to hold audio blobs.
function initializeObjectStore (db, collection) {
	var objectStore = db.createObjectStore("Recordings");
	objectStore.createIndex("collection", "collection", { unique: false });
	objectStore.createIndex("map", "map", { unique: false });
	// initialize metadata file
	// Use transaction oncomplete to make sure the objectStore creation is 
	// finished before adding data into it.
	objectStore.transaction.oncomplete = function(event) {
		// Store values in the newly created objectStore.
		var date = new Date().toLocaleString();
		var customerObjectStore = db.transaction(["Recordings"], "readwrite").objectStore("Recordings");
		// create empty text blob
		var blob = new Blob([''], { type: 'text/tsv', endings: 'native' });
		var request = customerObjectStore.add({ collection: collection, map: "", name: collection+".tsv", date: date, audio: blob }, collection+"/"+collection+".tsv");

		request.onsuccess = function(event) {
			console.log("Success: ", this.result, " ", date);
		};

		request.onerror = function(event) {
			console.log("Unable to add data: "+collection+"/"+collection+".tsv"+" cannot be created or updated");
		};
	};
};

// Use IndexedDB as an Audio storage
// Remove entries that have the same name
// The structure is: Directory, Filename, Binary data
function addAudioBlob(collection, map, name, blob) {
	addFileBlob(audioDatabaseName, collection, map, name, blob);
};

function addExamplesBlob(wordlist, name, blob) {
	addFileBlob(examplesDatabaseName, "Wordlists", wordlist, name, blob);
};

function addFileBlob(databaseName, collection, map, name, blob) {
	var date = new Date().toLocaleString();
	var db;
	var request = indexedDB.open(databaseName, indexedDBversion);
	request.onerror = function(event) {
	  alert("Use of IndexedDB not allowed");
	};
	request.onsuccess = function(event) {
		db = this.result;
		var key = (map.length > 0) ? collection+"/"+map+"/"+name : collection+"/"+name;
		var request = db.transaction(["Recordings"], "readwrite")
			.objectStore("Recordings")
			.put({ collection: collection, map: map, name: name, date: date, audio: blob }, key);
		
		request.onsuccess = function(event) {
			console.log("Success: ", this.result, " ", date);

		};
		
		// If data already exist, update it
		request.onerror = function(event) {
			console.log("Unable to add data: "+key+" cannot be created or updated");
		};
		
	};

	request.onupgradeneeded = function(event) {
		var db = this.result;
		// Create an objectStore to hold audio blobs.
		var objectStore = db.createObjectStore("Recordings");
		objectStore.createIndex("collection", "collection", { unique: false });
		objectStore.createIndex("map", "map", { unique: false });
		// Use transaction oncomplete to make sure the objectStore creation is 
		// finished before adding data into it.
		objectStore.transaction.oncomplete = function(event) {
			// Store values in the newly created objectStore.
			var date = new Date().toLocaleString();
			if (!(name && collection)) return;
			var customerObjectStore = db.transaction(["Recordings"], "readwrite").objectStore("Recordings");
			
			var request2 = customerObjectStore.add({ collection: collection, map: map, name: name, date: date, audio: blob }, collection+"/"+map+"/"+name);
			request2.onsuccess = function(event) {
				console.log("Success: ", this.result, " ", date);
			};
			
			request2.onerror = function(event) {
				console.log("Unable to add data: "+collection+"/"+map+"/"+name+" cannot be created or updated");
			};

			var tsvBlob = new Blob([''], { type: 'text/tsv', endings: 'native' });
			var request1 = customerObjectStore.add({ collection: collection, map: "", name: collection+".tsv", date: date, audio: tsvBlob }, collection+"/"+collection+".tsv");
			request1.onsuccess = function(event) {
				console.log("Success: ", this.result, " ", date);
			};
			
			request1.onerror = function(event) {
				console.log("Unable to add data: "+collection+"/"+map+"/"+name+" cannot be created or updated");
			};
		};
	};
};

// CSV is a list of objects, each with the same properties
function writeCSV(collection, csvList) {
	var map = "";
	var name = collection+".tsv";
	var blob = objectlist2csvblob (csvList);
	addAudioBlob(collection, map, name, blob);
};

// Iterate over all records
function getAllRecords (collection, processRecords) {
	var collectRecords = [];
	var db;
	var request = indexedDB.open(audioDatabaseName, indexedDBversion);
	request.onerror = function(event) {
	  alert("Use of IndexedDB not allowed");
	};
	request.onsuccess = function(event) {
		db = this.result;
		var objectStore = db.transaction("Recordings").objectStore("Recordings");
		var index = objectStore.index("collection");
		index.openCursor().onsuccess = function(event) {
		  var cursor = event.target.result;
		  if (cursor) {
			if (!collection || cursor.value.collection == collection) collectRecords.push(cursor.value);
		    cursor.continue();
		  } else {
			processRecords(collectRecords);
		  };
		};
	};

	request.onupgradeneeded = function(event) {
		var db = this.result;
		// Create an objectStore to hold audio blobs.
		initializeObjectStore (db, collection)
	};
};


// Initialize Audio storage
function initializeDataStorage (collection) {
	getCurrentMetaData (collection, false);
};

// Remove a collection
function removeCollection (collection, complete) {
	removeSubsetInDB (audioDatabaseName, collection, false, complete);
};

// Remove a wordlist
function removeExamples (wordlistName, complete) {
	removeSubsetInDB (examplesDatabaseName, false, wordlistName, complete);
};

function removeSubsetInDB (databaseName, collection, map, complete) {
	var db;
	var request = indexedDB.open(databaseName, indexedDBversion);
	request.onerror = function(event) {
	  alert("Use of IndexedDB not allowed");
	};
	request.onsuccess = function(event) {
		db = this.result;
		var objectStore = db.transaction("Recordings", "readwrite").objectStore("Recordings");
		var index = collection ? objectStore.index("collection") : objectStore.index("map");
		index.openCursor().onsuccess = function(event) {
		  var cursor = event.target.result;
		  if (cursor) {
			  var deleteCursor = false;
			  deleteCursor = deleteCursor || !(collection || map);
			  deleteCursor = deleteCursor || (!map && (collection && cursor.value.collection == collection));
			  deleteCursor = deleteCursor || (!collection && (map && cursor.value.map == map));
			  deleteCursor = deleteCursor || ((collection && cursor.value.collection == collection) && (map && cursor.value.map == map));
			if (deleteCursor) {
				var value = cursor.value;
		        var request = cursor.delete();
		        request.onsuccess = function() {
					console.log('Delete', value);
				};
			} else {
				if(complete)complete(collection);
			};
		    cursor.continue();
		  };
		};
	};

	request.onupgradeneeded = function(event) {
		var db = this.result;
		// Create an objectStore to hold audio blobs.
		initializeObjectStore (db, collection)
	};
	
};

// Remove Audio storage, including ALL data
function clearDataStorage (databaseName, storeName) {
	var db;
	var request = indexedDB.open(databaseName, 1);
	request.onerror = function(event) {
	  alert("Use of IndexedDB not allowed");
	};
	request.onsuccess = function(event) {
		db = this.result;
		var request = db.transaction([storeName], "readwrite")
			.objectStore(storeName)
			.clear();
		
		request.onsuccess = function(event) {
			console.log("Success: ", storeName);

		};
		
		// If data already exist, update it
		request.onerror = function(event) {
			console.log("Unable to clear "+storeName);
		};
	};
};
	

// Remove Audio storage, including ALL data
function deleteDatabase (databaseName) {
	var req = indexedDB.deleteDatabase(databaseName);
	req.onsuccess = function () {
	    console.log("Deleted database successfully");
	};
	req.onerror = function () {
	    console.log("Couldn't delete database");
	};
	req.onblocked = function () {
	    console.log("Couldn't delete database due to the operation being blocked");
	};
};

/*
 * 
 * Comma/Tab-Separated-Values
 * 
 */

// Convert a list of objects to a csv blob
function objectlist2csvblob (csvList) {
	var headerList = Object.keys(csvList[0]);
	var text = headerList.join("\t") + "\n";
	for (var i=0; i<csvList.length; ++i) {
		var valueList = [];
		for (var p=0; p<headerList.length; ++p) {
			valueList.push(csvList[i][headerList[p]]);
		};
		text += valueList.join("\t") + "\n";
	};
	var blob = new Blob ([text], {type: 'text/tsv', endings: 'native'});
	return blob;
};

function csvblob2objectlist (blob, handleList) {
	if(blob.type != "text/tsv") return undefined;
	var reader = new FileReader();
	reader.addEventListener("loadend", function() {
	   // reader.result contains the contents of blob as a typed array
		var lines = reader.result.split(/\r\n|\n/);
		var columnNames = lines[0].split(/\t/);
		var objectList = [];
		for (var i=1; i<lines.length; ++i) {
			if(lines[i].match(/\t/)) {
				var values = lines[i].split(/\t/);
				var record = {};
				for(var p=0; p<columnNames.length; ++p) {
					record[columnNames[p]] = values[p];
				};
				objectList.push(record);
			};
		};
		handleList(objectList);
	});
	reader.readAsText(blob);	
};

// Convert csv into an object. Must contain a property .key
function csvblob2object (blob, handleObject) {
	if(blob.type != "text/tsv") return {};
	var reader = new FileReader();
	reader.addEventListener("loadend", function() {
	   // reader.result contains the contents of blob as a typed array
		var lines = reader.result.split(/\r\n|\n/);
		var columnNames = lines[0].split(/\t/);
		var object = {};
		for (var i=1; i<lines.length; ++i) {
			if(lines[i].match(/\t/)) {
				var values = lines[i].split(/\t/);
				var record = {};
				for(var p=0; p<columnNames.length; ++p) {
					record[columnNames[p]] = values[p];
				};
				object[record.key] = record;
			};
		};
		handleObject(object);
	});
	reader.readAsText(blob);	
};

function csvList2object (csvList) {
	var object = {};
	for (var i=0; i<csvList.length; ++i) {
		object[csvList[i].key] = csvList[i];
	};
	return object;
};

function object2csvList (csvObject) {
	var keyList = Object.keys(csvObject);
	var csvList = [];
	for (var i=0; i<keyList.length; ++i) {
		csvList.push(csvObject[keyList[i]]);
	};
	return csvList;
};

// Do linear regression
// y = [<y-values]]
// y = [<x-values]]
// return {slope: , intercept: , r2: }
// 
// (by: Trent Richardson, 
//      http://trentrichardson.com/2010/04/06/compute-linear-regressions-in-javascript/)
function linearRegression(y,x){
		var lr = {};
		var n = y.length;
		var sum_x = 0;
		var sum_y = 0;
		var sum_xy = 0;
		var sum_xx = 0;
		var sum_yy = 0;
		
		for (var i = 0; i < y.length; i++) {
			
			sum_x += x[i];
			sum_y += y[i];
			sum_xy += (x[i]*y[i]);
			sum_xx += (x[i]*x[i]);
			sum_yy += (y[i]*y[i]);
		} 
		
		lr['slope'] = (n * sum_xy - sum_x * sum_y) / (n*sum_xx - sum_x * sum_x);
		lr['intercept'] = (sum_y - lr.slope * sum_x)/n;
		lr['r2'] = Math.pow((n*sum_xy - sum_x*sum_y)/Math.sqrt((n*sum_xx-sum_x*sum_x)*(n*sum_yy-sum_y*sum_y)),2);
		
		return lr;
};

// find y = a*x^2 + b*x + c from three points y=[], x=[]
// I would prefer a 5-point fit
function threePointParabola (y, x) {
    var a = ((y[1]-y[0])*(x[0]-x[2]) + (y[2]-y[0])*(x[1]-x[0]))/((x[0]-x[2])*(x[1]*x[1]-x[0]*x[0]) + (x[1]-x[0])*(x[2]*x[2]-x[0]*x[0]))
    var b = ((y[1] - y[0]) - a*(x[1]*x[1] - x[0]*x[0])) / (x[1]-x[0])
    var c = y[0] - a*x[0]*x[0] - b*x[0];
    return {a: a, b: b, c: c};
};
