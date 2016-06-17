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

// Global variables
var recordedBlob, recordedBlobURL;
var recordedArray, currentAudioWindow;
var recordedSampleRate, recordedDuration;
var recordedPitchTier;
var windowStart = windowEnd = 0;

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

	// make sure this funciton is defined!!!
	processRecordedSound ();
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
	for (var j = startLag; j <= endLag; ++j) {
		if (autocorr [j] > thressHold && autocorr [j] > bestAmp) {
			bestAmp = autocorr [j];
			bestLag = j;
		};
	};
	var pitch = bestLag ? sampleRate / bestLag : 0;
	resultArray.push(pitch, 0, 0, 0, 0);
	
	return resultArray;
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
		pitchArray.push({x: t, values: pitchCandidates});
	};
	return pitchArray;
};

// Pitch tracking and candidate selection
function toPitchTier (sound, sampleRate, fMin, fMax, dT) {
	var pitchArray = calculate_Pitch (sound, sampleRate, fMin, fMax, dT);
	var duration = sampleRate > 0 ? sound.length / sampleRate : 0;
	var points = [];
	
	// Select the best pitch candidates using tracking etc.
	for (var i=0; i < pitchArray.length; ++ i) {
		points.push({x: pitchArray [i].x, value: pitchArray [i].values [0] });
	};
	var pitchTier = {xmin: 0, xmax: duration, dT: dT, points: {size: points.length, items: points}};

	return pitchTier;
}

// DTW between two pitchTiers
function toDTW (pitchTier1, pitchTier2) {
	var dtw = {distance: 0, path: [], matrix: undefined};
	
	var pitch1 = pitchTier1.points.items;
	var pitch2 = pitchTier2.points.items;
	
	// Stub code giving fake results
	dtw.distance = Math.random()*Math.max(pitch1.length, pitch2.length);
	
	return dtw;
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
	var result = [];
	sortList.sort(compare);
	var sortListLength = sortList.length
	for (var i = sortListLength-1; i >= 0; --i) {
		if (remove(sortList[i])) sortList.splice(i, 1);
	};
	for (var i = 0; i < percentiles.length; ++i) {
		var perc = percentiles[i];
		if (perc > 1) perc /= 100;
		var newPercentile = {value: undefined, percentile: 0};
		newPercentile.value = sortList[Math.ceil(perc * sortList.length)];
		newPercentile.percentile = percentiles[i]; 
		result.push(newPercentile)
	};
	return result;
};
