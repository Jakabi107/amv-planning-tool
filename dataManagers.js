import { LocalDB } from "./utils.js";
import { formatTime } from "./utils.js";
import { escapeHTML } from "./utils.js";

export class DataOutputManager {
	constructor(
		audioElement, // Needed for setting the audio source
		titleElement, // Needed for setting the title text
		lyricsDisplay, // Needed for rendering lyrics
		commentsDisplay, // Needed for rendering comments
	) {
		this.audioElement = audioElement;
		this.titleElement = titleElement;
		this.lyricsDisplay = lyricsDisplay;
		this.commentsDisplay = commentsDisplay;
	}

	changeAudio(dataURL) {
		this.audioElement.src = dataURL;
	}

	changeTitle(newTitle) {
		this.titleElement.textContent = newTitle;
	}

	renderLyrics(rLyrics) {
		this.lyricsDisplay.innerHTML = "";
		let lyrics = rLyrics.toSorted((a, b) => a.time - b.time);

		lyrics.forEach((l) => {
			const div = document.createElement("div");
			div.className = "lyric-line";
			div.setAttribute("data-time", l.time);
			div.innerHTML = `
                <span class="lyric-text"></span>
                <span class="timestamp">${formatTime(l.time)}</span>
            `;

			div.querySelector(".lyric-text").textContent = l.text; // set lyric text with textContent to prevent XSS

			// Click Lyric to Skip Audio to that Timestamp
			// automatically adjusts layout of lyrics cause timeupdate of audio gets triggered
			div.addEventListener("click", () => {
				const targetTime = parseFloat(div.getAttribute("data-time"));
				this.audioElement.currentTime = targetTime;
			});

			this.lyricsDisplay.appendChild(div);
		});
	}

	renderComments(rComments) {
		// Sort comments chronologically by timestamp
		let comments = rComments.toSorted((a, b) => a.time - b.time);

		this.commentsDisplay.innerHTML = "";
		comments.forEach((c) => {
			const div = document.createElement("div");
			div.className = "comment-box";
			div.setAttribute("data-time", c.time);
			div.setAttribute("data-id", c.id);
			div.innerHTML = `
                <span class="comment-time" onclick="seekTo(${c.time})">[${formatTime(c.time)}]</span>
                <p class="comment-text-inline">${this.formatComment(c.text)}</p>
                <button onclick="deleteComment(${c.id})" class="comment-delete-btn" title="Delete comment">
                    <img src="images/delete.svg" alt="Delete" class="comment-delete-icon" />
                </button>
            `;
			this.commentsDisplay.appendChild(div);
		});
	}

	formatComment(commentText) {
		const HTTP_URL_REGEX =
			/(http|https):\/\/([\w_-]+(?:(?:\.[\w_-]+)+))([\w.,@?^=%&:\/~+#-]*[\w@?^=%&\/~+#-])/g;
		// First escape HTML to prevent XSS, then replace URLs with anchor tags
		commentText = escapeHTML(commentText);

		return commentText.replaceAll(
			HTTP_URL_REGEX,
			'<a href="$&" class="comment-link" target="_blank">$&</a>',
		);
	}
}

export class DataManager {
	constructor(dataOutputManager) {
		this.dataOutputManager = dataOutputManager;
		this.localDBInstance = new LocalDB();
		this.audioFileDataURL = null;
		this.comments = [];
		this.lyrics = [];
		this.title = "unnamed";
		this.commentIdCounter = 0;
	}
	// title
	changeTitle(newTitle, save = true, set = true) {
		this.title = newTitle;
		if (set) this.dataOutputManager.changeTitle(newTitle);
		if (save) this.saveProjectToCache();
	}
	// audio
	changeAudio(dataURL, save = true) {
		this.audioFileDataURL = dataURL;
		this.dataOutputManager.changeAudio(dataURL);
		if (save) this.saveProjectToCache(); // Updated call
	}
	// lyrics
	changeLyrics(newLyrics, save = true) {
		this.lyrics = newLyrics;
		this.dataOutputManager.renderLyrics(this.lyrics);
		if (save) this.saveProjectToCache(); // Updated call
	}
	// comments
	changeComments(newComments, save = true) {
		this.commentIdCounter = 0; // Reset comment id counter
		this.comments = newComments;
		this.addIdsToComments(this.comments);
		this.dataOutputManager.renderComments(this.comments);
		if (save) this.saveProjectToCache(); // Updated call
	}

	addIdsToComments(newComments) {
		newComments.forEach((c) => {
			c.id = this.commentIdCounter++;
		});
	}

	appendComment(comment, save = true) {
		comment.id = this.commentIdCounter++;
		this.comments.push(comment);
		this.dataOutputManager.renderComments(this.comments);
		if (save) this.saveProjectToCache(); // Updated call
	}

	deleteCommentById(commentId, save = true) {
		let commentToDelete = this.comments.find((c) => c.id === commentId);
		this.deleteComment(commentToDelete, save);
	}

	deleteComment(commentToDelete, save = true) {
		this.comments = this.comments.filter((c) => c !== commentToDelete);
		this.dataOutputManager.renderComments(this.comments);
		if (save) this.saveProjectToCache(); // Updated call
	}

	getAllDataObject() {
		return {
			audio: this.audioFileDataURL,
			lyrics: this.lyrics,
			comments: this.comments,
			title: this.title,
		};
	}

	setAllDataObject(data) {
		this.changeTitle(data.title, false);
		this.changeAudio(data.audio, false);
		this.changeLyrics(data.lyrics, false);
		this.changeComments(data.comments, false);
		this.saveProjectToCache(); // Updated call
	}

	resetAllData() {
		this.setAllDataObject({
			audio: "",
			lyrics: [],
			comments: [],
			title: "unnamed",
		});
	}

	// New methods for caching
	async saveProjectToCache() {
		const data = this.getAllDataObject();
		await this.localDBInstance.setItem("lastProject", data);
	}

	async loadProjectFromCache() {
		const data = await this.localDBInstance.getItem("lastProject");
		if (data) {
			this.setAllDataObject(data);
		}
	}
}
