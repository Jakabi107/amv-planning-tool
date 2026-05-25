const audio = document.getElementById('audio-player');
const audioUpload = document.getElementById('audio-upload');
const titleElement = document.getElementById('title');

const lyricsDisplay = document.getElementById('lyric-timeline');
const lyricsUpload = document.getElementById('lyrics-upload');


const commentForm = document.getElementById('comment-form');
const commentInput = document.getElementById('comment-input');
const commentsDisplay = document.getElementById('comments-display');
const commentUpload = document.getElementById('comments-upload');

const LRC_TIMESTAMP_REGEX = "\\[[0-9][0-9]:[0-9][0-9].[0-9][0-9]\]"
const LRC_TIMESTAMP_LENGTH = 10

const allDataUpload = document.getElementById('all-data-upload');

let audioFileDataURL;


// Sample initial comments data
let comments = [
];

let lyrics = [
]


// --- clicking and syncing ---
// sync lyrics with audio
// only works if in order
audio.addEventListener('timeupdate', () => {
    const currentTime = audio.currentTime;
    
    let lyricLineElements = document.querySelectorAll('.lyric-line');

    lyricLineElements.forEach((line, index) => {
        const lineTime = parseInt(line.getAttribute('data-time'));

        const nextLineTime = lyricLineElements[index + 1] 
            ? parseInt(lyricLineElements[index + 1].getAttribute('data-time')) 
            : Infinity;

        if (currentTime >= lineTime && currentTime < nextLineTime) {
            // visual change
            line.classList.add('active');
            // scroll to lyric
            line.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
            line.classList.remove('active');
        }
    });
});


// Click Timestamp in Comment to Skip Audio
// Expose as global for inline onclick handlers
window.seekTo = function(seconds) {
    audio.currentTime = seconds;
};

// New Comment Submission
commentForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Capture the exact moment the user pressed submit
    const currentAudioTime = audio.currentTime  ; 
    const text = commentInput.value.trim();

    if (text) {
        comments.push({ time: currentAudioTime, text: text });
        commentInput.value = '';
        renderComments();
        
        // Scroll to bottom of comments
        commentsDisplay.scrollTop = commentsDisplay.scrollHeight;
    }
});

// --- lyrics input management ---

// new lyrics input 
lyricsUpload.addEventListener('change', async function(event){
    const file = event.target.files[0];
    if (!file) return;
    const fileContent = await readFileAsText(file);
    let newLyrics = parseLRC(fileContent)
    changeLyrics(newLyrics)
})

// change lyrics
function changeLyrics(newLyrics){
    lyrics = newLyrics;
    renderLyrics()
}

function parseLRC(lrcContent){
    let lines = sliceLyricsFromLRC(lrcContent);

    let lineElements = []
    lines.forEach(line => {
        lineElement = {}
        // parse time
        let timestamp = line.match(LRC_TIMESTAMP_REGEX)[0]
        lineElement.time = parseLRCTimestamp(timestamp)
        // remove timestamp from text
        lineElement.text = line.slice(LRC_TIMESTAMP_LENGTH)

        lineElements.push(lineElement)
    })
    return lineElements;
}

function sliceLyricsFromLRC(str){
    // get all timestamps
    let matchIterator = str.matchAll(LRC_TIMESTAMP_REGEX)
    // put them into a list
    let matches = []
    matchIterator.forEach((match)=>{
        matches.push(match)
    })

    // slice from one timestamp to the other
    let lines = [];
    matches.forEach((match, index) => {
        let nextMatch = matches[index + 1]
        let nextMatchPos = -1;
        if (nextMatch) nextMatchPos = nextMatch.index

        lines.push(str.slice(match.index, nextMatchPos).trim())
    })
    
    return lines
}

function parseLRCTimestamp(timestamp){
    let minutes = parseInt(timestamp.slice(1,3))
    let seconds = parseFloat(timestamp.slice(4,9))
    return minutes * 60 + seconds
}



// --- audio file management ---

// new audio file input
audioUpload.addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        changeAudioFile(file);
    }
});

// change audio file
function changeAudioFile(file) {
    readFileAsDataURL(file).then((dataURL) => {
        changeAudio(dataURL);
    });
}

function changeAudio(dataURL){
    audioFileDataURL = dataURL;
    audio.src = new Audio(dataURL).src;
}


// --- comment file management ---

// new comment file input 
commentUpload.addEventListener('change', async function(event) {
    const file = event.target.files[0];
    const commentsJSON = await readFileAsText(file);
    changeComments(JSON.parse(commentsJSON));
})

function downloadComments(){
    // create a "link" that contains the data 
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(comments));
    downloadWithLink(dataStr, "comments.json");
}

function changeComments(newComments){
    comments = newComments;
    renderComments();
}



// --- download all data ---
allDataUpload.addEventListener('change', function(event) {
    const file = event.target.files[0];
    loadAllFromFile(file);
})

function downloadAll(){
    if (!audioFileDataURL) {
        alert("Please upload an audio file before downloading. May be that the audiofile is not loaded yet, try again in a few seconds.");
        return;
    }

    let outfile = {}
    outfile.audio = audioFileDataURL;
    outfile.lyrics = lyrics;
    outfile.comments = comments;
    outfile.title = titleElement.value;
    downloadWithLink("data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(outfile)), "out.amvp");
}


async function loadAllFromFile(file){
    const fileContent = await readFileAsText(file);
    const data = JSON.parse(fileContent);

    changeTitle(data.title);
    changeAudio(data.audio);
    changeLyrics(data.lyrics);
    changeComments(data.comments);
}



// --- rendering ---

// Render Lyrics to the UI
function renderLyrics() {
    lyrics.sort((a, b) => a.time - b.time);

    lyricsDisplay.innerHTML = '';

    lyrics.forEach(l => {
        const div = document.createElement('div');
        div.className = 'lyric-line';
        div.setAttribute('data-time', l.time);
        div.innerHTML = `
            <span>${l.text}</span>
            <span class="timestamp">${formatTime(l.time)}</span>
        `;

        // Click Lyric to Skip Audio to that Timestamp
        // automatically adjusts layout of lyrics cause timeupdate of audio gets triggered
        div.addEventListener('click', () => {
            const targetTime = parseFloat(div.getAttribute('data-time'));
            audio.currentTime = targetTime;
        });

        lyricsDisplay.appendChild(div);
    });
}


// Render Comments to the UI
function renderComments() {
    // Sort comments chronologically by timestamp
    comments.sort((a, b) => a.time - b.time);
    
    commentsDisplay.innerHTML = '';
    comments.forEach(c => {
        const div = document.createElement('div');
        div.className = 'comment-box';
        div.innerHTML = `
            <span class="comment-time" onclick="seekTo(${c.time})">[${formatTime(c.time)}]</span>
            <p>${c.text}</p>
        `;
        commentsDisplay.appendChild(div);
    });
}


// --- title management ---
titleElement.addEventListener('input', () => {
    titleElement.value = titleElement.innerHTML.trim();
});

function changeTitle(newTitle){
    titleElement.innerHTML = newTitle;
    titleElement.value = newTitle;
}


// Initial render on load
renderComments();
renderLyrics();
