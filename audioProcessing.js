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
var recordedArray;
var recordedDuration;
var recordedPitchTier;
var windowStart = windowEnd = 0;
var recordedSampleRate = 0;
var currentAudioWindow = undefined;

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
	// Note this one should be switched AFTER processRecordedSound ahs been called.
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

// PitchTier definition
function Tier () {
	// data
	this.xmin = undefined;
	this.xmax = undefined;
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
			this.values [i] = item.value;
			return i;
		} else {
			console.log("Item "+i+" does not exist");
			return false;
		}
	};
	this.pushItem = function (item) {
		this.time.push(item.x);
		this.values.push(item.value);
		this.size = this.time.length;
		this.xmax = item.x;
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
	var pitchTier = new Tier();
	pitchTier.xmin = 0;
	pitchTier.dT = dT;
	for (var i=0; i < pitchArray.length; ++ i) {
		pitchTier.pushItem ({x: pitchArray [i].x, value: pitchArray [i].values [0] })
	};
	
	return pitchTier;
}



// DTW between two pitchTiers
function toDTW (pitchTier1, pitchTier2) {
	var dtw = {distance: 0, path: [], matrix: undefined};
	
	var pitch1 = pitchTier1.valueSeries();
	var pitch2 = pitchTier2.valueSeries();
	
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
		if (remove(sortList[i])) {
			sortList.splice(i, 1);
		};
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

// Use IndexedDB as an Audio storage
function saveCurrentAudioWindow (map, fileName) {
console.log("saveCurrentAudioWindow ", map, fileName);
	if (!currentAudioWindow || currentAudioWindow.length <= 0 || ! recordedSampleRate || recordedSampleRate <= 0) return;
	var blob = arrayToBlob (currentAudioWindow, 0, 0, recordedSampleRate);
	if (map && map.length > 0 && fileName && fileName.length > 0) {
		addAudioBlob(map, fileName, blob);
	};
};

var indexedDBversion = 2;
function getCurrentAudioWindow (map, name) {
	var request = indexedDB.open("Audio", indexedDBversion);
	request.onerror = function(event) {
	  alert("Use of IndexedDB not allowed");
	};
	request.onsuccess = function(event) {
		db = this.result;
		var request = db.transaction(["Recordings"], "readwrite")
			.objectStore("Recordings")
			.get(map+"/"+name);
		
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
			console.log("Unable to ertrieve data: "+map+"/"+name+" cannot be found");
		};
	};
	request.onerror = function(event) {
		console.log("Error: ", event);
	}
	request.onupgradeneeded = function(event) {
		var db = this.result;
		// Create an objectStore to hold audio blobs.
		var objectStore = db.createObjectStore("Recordings");
	};
};

// Use IndexedDB as an Audio storage
// Remove entries that have the same name
// The structure is: Directory, Filename, Binary data
function addAudioBlob(map, name, blob) {
	var date = new Date().toLocaleString();
	var db;
	var request = indexedDB.open("Audio", indexedDBversion);
	request.onerror = function(event) {
	  alert("Use of IndexedDB not allowed");
	};
	request.onsuccess = function(event) {
		db = this.result;
		var request = db.transaction(["Recordings"], "readwrite")
			.objectStore("Recordings")
			.put({ map: map, name: name, date: date, audio: blob }, map+"/"+name);
		
		request.onsuccess = function(event) {
			console.log("Success: ", this.result, " ", date);

		};
		
		// If data already exist, update it
		request.onerror = function(event) {
			alert("Unable to add data\r\n"+name+" cannot be created or updated");
			console.log("Unable to add data: "+name+" cannot be created or updated");
		};
	};

	request.onupgradeneeded = function(event) {
		var db = this.result;
		// Create an objectStore to hold audio blobs.
		var objectStore = db.createObjectStore("Recordings");
		// Use transaction oncomplete to make sure the objectStore creation is 
		// finished before adding data into it.
		objectStore.transaction.oncomplete = function(event) {
			// Store values in the newly created objectStore.
			var date = new Date().toLocaleString();
			var customerObjectStore = db.transaction(["Recordings"], "readwrite").objectStore("Recordings");
			customerObjectStore.add({ map: map, name: name, date: date, audio: blob }, map+"/"+name);
			request.onsuccess = function(event) {
				console.log("Success: ", this.result, " ", date);
	
			};
			
			request.onerror = function(event) {
				alert("Unable to add data\r\n"+name+" cannot be created or updated");
				console.log("Unable to add data: "+name+" cannot be created or updated");
			};
		};
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
			alert("Unable to clear "+storeName);
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
