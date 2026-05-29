import { beforeAll, beforeEach, test } from "vitest";
import DataManager from "../datamanager";

let dataManager;
let commentForm;
let commentInput;
let commentsDisplay;

beforeAll(() => {
	document.body.innerHTML = `
    <div id="comment-section" class="comment-section">
            <div class="comments-display" id="comments-display"></div>

            <form class="comment-form" id="comment-form">
                <input
                    class="needs-typing"
                    type="text"
                    id="comment-input"
                    placeholder="Add a comment at the current timestamp..."
                    required
                />
                <button type="submit">Comment</button>
            </form>
        </div>
    `;
	commentForm = document.getElementById("comment-form");
	commentInput = document.getElementById("comment-input");
	commentsDisplay = document.getElementById("comments-display");
	dataManager = new DataManager(false);
});

beforeEach(() => {
	// Clear comments before each test
	dataManager.resetAllData();
});

test("exists", () => {
	expect(dataManager).toBeDefined();
	expect(commentForm).toBeDefined();
	expect(commentInput).toBeDefined();
	expect(commentsDisplay).toBeDefined();
});


