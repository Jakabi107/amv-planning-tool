const audio = document.getElementById('audio-player');
const lyricLines = document.querySelectorAll('.lyric-line');
const commentForm = document.getElementById('comment-form');
const commentInput = document.getElementById('comment-input');
const commentsDisplay = document.getElementById('comments-display');
const audioUpload = document.getElementById('audio-upload');

// Sample initial comments data
let comments = [
    { time: 12, text: "I love the bassline that starts right here!" },
    { time: 40, text: "Best chorus of the entire album hands down." }
];

// Helper function to format seconds (e.g., 72 -> 1:12)
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

// sync lyrics with audio
// only works if in order
audio.addEventListener('timeupdate', () => {
    const currentTime = audio.currentTime;
    
    lyricLines.forEach((line, index) => {
        const lineTime = parseInt(line.getAttribute('data-time'));

        const nextLineTime = lyricLines[index + 1] 
            ? parseInt(lyricLines[index + 1].getAttribute('data-time')) 
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


// Click Lyric to Skip Audio to that Timestamp
// automatically adjusts layout of lyrics cause timeupdate of audio gets triggered
lyricLines.forEach(line => {
    line.addEventListener('click', () => {
        const targetTime = parseInt(line.getAttribute('data-time'));
        audio.currentTime = targetTime;
        // audio.play();
    });
});

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

// Click Timestamp in Comment to Skip Audio
// Expose as global for inline onclick handlers
window.seekTo = function(seconds) {
    audio.currentTime = seconds;
    audio.play();
};

// New Comment Submission
commentForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Capture the exact moment the user pressed submit
    const currentAudioTime = Math.floor(audio.currentTime); 
    const text = commentInput.value.trim();

    if (text) {
        comments.push({ time: currentAudioTime, text: text });
        commentInput.value = '';
        renderComments();
        
        // Scroll to bottom of comments
        commentsDisplay.scrollTop = commentsDisplay.scrollHeight;
    }
});


// new file input
audioUpload.addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        changeAudioFile(file);
    }
});

// change audio file
function changeAudioFile(file) {
    const fileURL = URL.createObjectURL(file);
    audio.src = fileURL;
}

// Initial render on load
renderComments();
