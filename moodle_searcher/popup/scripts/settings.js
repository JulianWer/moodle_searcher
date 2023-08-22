import { setMoodleUrl, getMoodleUrl } from './moodleUrl.js';

const INPUT = document.getElementById('moodle-url-button');
const SAVE_BUTTON = document.getElementById('change-moodle-url-button');
SAVE_BUTTON.addEventListener('click', _ => setMoodleUrl(INPUT.value));
INPUT.addEventListener('keydown', e => {
	if (e.key === 'Enter') {
		setMoodleUrl(INPUT.value);
	}
});

INPUT.value = await getMoodleUrl();
