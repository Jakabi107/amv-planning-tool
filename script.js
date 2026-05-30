import {
	readFileAsDataURL,
	readFileAsText,
	downloadWithLink,
} from "./utils.js";

import { DataOutputManager, DataManager } from "./dataManagers.js";

const audio = document.getElementById("audio-player");
const titleElement = document.getElementById("title");

const lyricsDisplay = document.getElementById("lyric-timeline");

const commentForm = document.getElementById("comment-form");
const commentInput = document.getElementById("comment-input");
const commentsDisplay = document.getElementById("comments-display");

const LRC_TIMESTAMP_REGEX = "\\[[0-9][0-9]:[0-9][0-9].[0-9][0-9]\]";
const LRC_TIMESTAMP_LENGTH = 10;

const dataUpload = document.getElementById("data-upload");
const uploadSelect = document.getElementById("upload-select");
const UPLOADTYPE_ALLOWED_FILES = {
	all: [".amvp"],
	comments: [".json"],
	lyrics: [".lrc"],
	audio: [".mp3"],
};

const downloadButton = document.getElementById("download-button");
const resetButton = document.getElementById("reset-button");

const dataOutputManager = new DataOutputManager(
	audio,
	titleElement,
	lyricsDisplay,
	commentsDisplay,
);
const dataManager = new DataManager(dataOutputManager); // Pass localDBInstance to DataManager constructor

// --- clicking and syncing ---
// sync lyrics with audio
// only works if in order
audio.addEventListener("timeupdate", () => {
	const currentTime = audio.currentTime;

	let lyricLineElements = document.querySelectorAll(".lyric-line");

	lyricLineElements.forEach((line, index) => {
		const lineTime = parseInt(line.getAttribute("data-time"));

		const nextLineTime = lyricLineElements[index + 1]
			? parseInt(lyricLineElements[index + 1].getAttribute("data-time"))
			: Infinity;

		if (currentTime >= lineTime && currentTime < nextLineTime) {
			// visual change
			line.classList.add("active");
			// scroll to lyric
			line.scrollIntoView({ behavior: "smooth", block: "nearest" });
		} else {
			line.classList.remove("active");
		}
	});
});

function skipToNextLyric() {
	let activeLyric = document.querySelector(".lyric-line.active");
	if (activeLyric) {
		let nextLyric = activeLyric.nextElementSibling;
		if (nextLyric) nextLyric.click();
	}
}

function skipToPreviousLyric() {
	let activeLyric = document.querySelector(".lyric-line.active");
	if (activeLyric) {
		let prevLyric = activeLyric.previousElementSibling;
		if (prevLyric) prevLyric.click();
	}
}

document.addEventListener("keydown", (e) => {
	// ctrl shortcuts - should overwrite non ctrl shortcuts if they are the same keys
	if (e.ctrlKey || e.metaKey) {
		if (e.key === "ArrowDown" || e.key === "ArrowUp") {
			e.preventDefault();
			moveCommentsToTimestamp(audio.currentTime);
		}
		if (e.key == "Enter") {
			e.preventDefault();
			audio.paused ? audio.play() : audio.pause();
		}
		//non ctrl keys shortcuts
	} else if (e.key === "ArrowDown") {
		e.preventDefault();
		skipToNextLyric();
	} else if (e.key === "ArrowUp") {
		e.preventDefault();
		skipToPreviousLyric();
	} else if (
		(e.key == " " || e.key == "Enter") &&
		!document.activeElement.classList.contains("needs-typing")
	) {
		e.preventDefault();
		audio.paused ? audio.play() : audio.pause();
	}
});

// moves to comment closest after the timestamp
function moveCommentsToTimestamp(seconds) {
	let nearestComment = null;
	let smallestDiff = Infinity;
	document
		.getElementById("comment-section")
		.querySelectorAll(".comment-box")
		.forEach((comment) => {
			const commentTime = parseFloat(comment.getAttribute("data-time"));
			const diff = commentTime - seconds;
			if (diff < smallestDiff && diff >= 0) {
				smallestDiff = diff;
				nearestComment = comment;
			}
		});
	if (nearestComment) {
		nearestComment.scrollIntoView({ behavior: "smooth", block: "start" });
	}
	return nearestComment;
}

// Click Timestamp in Comment to Skip Audio
// Expose as global for inline onclick handlers
window.seekTo = function (seconds) {
	audio.currentTime = seconds;
};

// New Comment Submission
commentForm.addEventListener("submit", (e) => {
	e.preventDefault();

	// Capture the exact moment the user pressed submit
	const currentAudioTime = audio.currentTime;
	const text = commentInput.value.trim();

	if (text) {
		dataManager.appendComment({ time: currentAudioTime, text: text });
		commentInput.value = "";

		moveCommentsToTimestamp(currentAudioTime);
	}
});

// --- manage uploading ---
dataUpload.addEventListener("change", function (event) {
	const file = event.target.files[0];
	if (
		!confirm(
			"Uploading will overwrite existing data. Do you want to continue?",
		) ||
		!file
	) {
		dataUpload.value = null; // reset file input
		return;
	}

	let uploadType = uploadSelect.value;
	if (uploadType == "all") {
		loadAllFromFile(file);
	}

	if (uploadType == "comments") {
		readFileAsText(file).then((commentsJSON) => {
			dataManager.changeComments(JSON.parse(commentsJSON));
		});
	}

	if (uploadType == "lyrics") {
		readFileAsText(file).then((lrcContent) => {
			let newLyrics = parseLRC(lrcContent);
			dataManager.changeLyrics(newLyrics);
		});
	}

	if (uploadType == "audio") {
		changeAudioFile(file);
	}

	dataUpload.file = null; // reset file input to allow re-uploading the same file if needed
});

// --- lyrics input management ---

// new lyrics input

function parseLRC(lrcContent) {
	let lines = sliceLyricsFromLRC(lrcContent);

	let lineElements = [];
	lines.forEach((line) => {
		lineElement = {};
		// parse time
		let timestamp = line.match(LRC_TIMESTAMP_REGEX)[0];
		lineElement.time = parseLRCTimestamp(timestamp);
		// remove timestamp from text
		lineElement.text = line.slice(LRC_TIMESTAMP_LENGTH);

		lineElements.push(lineElement);
	});
	return lineElements;
}

function sliceLyricsFromLRC(str) {
	// get all timestamps
	let matchIterator = str.matchAll(LRC_TIMESTAMP_REGEX);
	// put them into a list
	let matches = [];
	matchIterator.forEach((match) => {
		matches.push(match);
	});

	// slice from one timestamp to the other
	let lines = [];
	matches.forEach((match, index) => {
		let nextMatch = matches[index + 1];
		let nextMatchPos = -1;
		if (nextMatch) nextMatchPos = nextMatch.index;

		lines.push(str.slice(match.index, nextMatchPos).trim());
	});

	return lines;
}

function parseLRCTimestamp(timestamp) {
	let minutes = parseInt(timestamp.slice(1, 3));
	let seconds = parseFloat(timestamp.slice(4, 9));
	return minutes * 60 + seconds;
}

// --- audio file management ---

// change audio file
function changeAudioFile(file) {
	readFileAsDataURL(file).then((dataURL) => {
		dataManager.changeAudio(dataURL);
	});
}

// --- comment file management ---

// new comment file input
function downloadComments() {
	// create a "link" that contains the data
	const dataStr =
		"data:text/json;charset=utf-8," +
		encodeURIComponent(JSON.stringify(dataManager.comments));
	downloadWithLink(dataStr, "comments.json");
}

// --- download all data ---
function downloadAll() {
	if (!dataManager.audioFileDataURL) {
		alert(
			"Please upload an audio file before downloading. May be that the audiofile is not loaded yet, try again in a few seconds.",
		);
		return;
	}

	let outfile = dataManager.getAllDataObject();
	downloadWithLink(
		"data:text/json;charset=utf-8," +
			encodeURIComponent(JSON.stringify(outfile)),
		`${outfile.title ? outfile.title : "Unnamed"}.amvp`,
	);
}

async function loadAllFromFile(file) {
	const fileContent = await readFileAsText(file);
	const data = JSON.parse(fileContent);

	loadProject(data);
}

function loadProject(projectData) {
	dataManager.setAllDataObject(projectData);
}

downloadButton.addEventListener("click", downloadAll);

// check for cmd s
document.addEventListener("keydown", (e) => {
	if (
		e.keyCode === 83 &&
		(navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey)
	) {
		e.preventDefault();
		downloadAll();
	}
});

window.deleteComment = (id) => {
	if (confirm("Are you sure you want to delete this comment?")) {
		dataManager.deleteCommentById(id);
	}
};

// --- title management ---
titleElement.addEventListener("input", () => {
	dataManager.changeTitle(titleElement.innerHTML.trim(), true, false);
});

// --- select upload type management ---
uploadSelect.addEventListener("change", function () {
	const uploadType = uploadSelect.value;
	dataUpload.accept = UPLOADTYPE_ALLOWED_FILES[uploadType].join(",");
});

// --- reset management ---
resetButton.addEventListener("click", () => {
	if (
		confirm("Are you sure you want to reset all data? This cannot be undone.")
	) {
		dataManager.resetAllData();
	}
});

// load last project on start
dataManager.loadProjectFromCache(); // Updated call
