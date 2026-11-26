# CopyLekha: Product Requirements Document

- **Product:** CopyLekha, copywork practice for IELTS Academic Writing
- **Live app:** [copylekha.vercel.app](https://copylekha.vercel.app)
- **Source:** [github.com/hossain101199/CopyLekha](https://github.com/hossain101199/CopyLekha)
- **Owner:** Hossain
- **Last updated:** 24 November 2026

## Contents

1. [Overview](#1-overview)
2. [Target users](#2-target-users)
3. [Goals](#3-goals)
4. [Non-goals](#4-non-goals)
5. [User flows](#5-user-flows)
6. [Functional requirements](#6-functional-requirements)
7. [Non-functional requirements](#7-non-functional-requirements)
8. [UI and UX](#8-ui-and-ux)
9. [Data model and storage](#9-data-model-and-storage)
10. [Edge cases](#10-edge-cases)
11. [Future ideas](#11-future-ideas)

- [Appendix A: The AI prompt](#appendix-a-the-ai-prompt)

## 1. Overview

### The problem

IELTS candidates read many Band 8.5+ model answers, but reading alone rarely makes their structure, grammar and collocations stick. Copywork, retyping a well-written text word by word, forces attention onto every word, capital letter and comma. Done by hand or in a normal text editor, though, it is slow to set up and nothing points out the mistakes: the learner has to find model answers, then check each word against the original.

### The solution

CopyLekha is a web app for copywork. It shows a model answer above and a typing box below. It catches every difference in spelling, capital letters and punctuation as the learner types, and at the end shows the speed, the accuracy, each mistake by kind and the answer's vocabulary.

Model answers come from the learner's own AI chat (ChatGPT, Claude, Gemini): CopyLekha gives a ready prompt that returns one Task 1 and one Task 2 answer a day, and splits the pasted reply into the question, the answer and the vocabulary of each task.

Everything runs in the browser. There is no account and no server, and the learner's data stays on their device.

### The name

"Copy" plus the Bangla word "লেখা" (lekha, "writing").

## 2. Target users

**Primary:** candidates in Bangladesh preparing for IELTS Academic, aiming for Band 8.5+ in Writing.

- Their English is already good. What holds them back is precision: collocations, linking words, punctuation and the structure of a high-band answer.
- They practise on a laptop or desktop computer with a physical keyboard.
- Many already use an AI chat such as ChatGPT, Claude or Gemini.
- Some type Bangla with an input method such as Avro, so it must not get in the way of typing.

**Secondary:** IELTS Academic candidates in other countries with the same goal.

## 3. Goals

- Daily copywork habit: one Task 1 and one Task 2 a day.
- Every mistake caught while typing.
- No account, no setup, private by default.

## 4. Non-goals

- Generating or grading answers (the learner's own AI does that).
- Sending the learner's text to any server.
- Typing on phones.
- IELTS General Training, Reading, Listening or Speaking.

## 5. User flows

### 5.1 First visit

1. The learner opens the app. Two sample answers (one Task 1, one Task 2) are added to the Library, and the Task 2 sample is loaded, so typing can start at once.
2. How it works opens by itself. It explains copywork, the daily steps, the marks in the model answer and the keyboard shortcuts. On this first visit it can't be closed; its only button is **Show me around**.
3. The guided tour points at six controls in turn: the model answer, the typing box, Get answers from AI, Paste, Library, and the timer and settings. The learner can go back, go on or skip the tour.
4. When the tour ends, the cursor is in the typing box.

If the browser can't store data, the samples are still loaded, the guide doesn't open by itself, and a notice says progress won't be saved.

### 5.2 Daily practice

1. The learner opens the app. The answer opened last is loaded (else the newest one), with its task question above it.
2. The first key starts the timer. The word to type next is underlined in the model answer, and the sentence being typed has a soft background.
3. **Space** moves to the next word, even when the word is wrong. At the end of a paragraph **Enter** is needed instead, and the box says so if Space is pressed. **Backspace** corrects only the word being typed.
4. With sound on, each new word is read aloud.
5. **Esc** pauses and resumes. The attempt also pauses when the typing box, the window or the tab loses focus. The next key goes on.
6. The attempt finishes when the last word is typed, when the learner clicks **Finish**, or when the time limit (20 or 40 minutes) runs out. **Restart** or **Ctrl/Cmd + Enter** starts again without saving.

### 5.3 Getting answers from AI

1. The learner clicks **Get answers from AI**. The dialog shows three steps and the prompt.
2. The learner copies the prompt (or clicks **Open in ChatGPT**, which opens it already filled in) and writes **Start Day N** in their AI chat. N is the day after the newest one in the Library.
3. The learner copies the whole reply and clicks **Paste the reply**, which opens the Paste dialog.
4. After the reply is pasted, a preview shows what was found, for example "Day 3: Task 1, 172 words · Task 2, 268 words". It also says if a task is already in the Library.
5. **Save and start Task 1** saves both tasks and loads the first one saved, with its question and vocabulary.

A single model answer can also be pasted by hand. The learner picks its task and may give it a title; without one, the answer's first six words become the title.

### 5.4 Result

1. The Result replaces the two boxes when the attempt finishes. An attempt with no word typed is neither shown nor saved.
2. It shows WPM, accuracy, time and words typed, and compares the accuracy with the last attempt and the best one on the same answer.
3. It lists the mistakes: a count for each kind (spelling, capital letters, punctuation) and a table of each wrong word, what was typed and its kind.
4. It lists the answer's vocabulary, and marks each phrase that had a mistake inside it.
5. The learner can **Try again**, start the next answer of the daily order (Day 1 Task 1, Day 1 Task 2, Day 2 Task 1 ...) or choose another answer from the Library. After a sample answer, the Result also suggests getting answers from AI.

### 5.5 Library

1. The learner clicks **Library**. A side panel lists every answer, grouped by day (newest day first, Task 1 before Task 2), then answers without a day under "Other answers".
2. Each row shows the title, the task, the word count and the last accuracy. The answer open now is marked.
3. At the top: on how many of the last seven days the learner practised, the streak of days in a row, and **Up next**, the first answer of the daily order not practised yet.
4. The learner can load, rename or delete an answer. Deleting asks first and also deletes its attempts.
5. **Export** at the bottom of the panel downloads every answer and attempt as one JSON file, as a backup.

## 6. Functional requirements

Each requirement has an ID made of its area and a number, such as `FR-TYPE-03`. An ID never changes and is never reused: a new requirement gets the next free number in its area, and a removed one stays in the list marked _Retired_.

### 6.1 Typing (TYPE)

| ID         | Requirement                                                                                                                                                                                          |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-TYPE-01 | A model answer is split into words at spaces and line breaks. Punctuation belongs to the word it touches ("years,"). One or more line breaks end a paragraph.                                        |
| FR-TYPE-02 | The word to type next is underlined in the model answer, and the sentence it belongs to has a soft background. A paragraph's last word is followed by a return arrow (↵).                            |
| FR-TYPE-03 | A letter, digit or symbol is added to the word being typed. Letters typed past the model word's length are kept and count as part of the typed word.                                                 |
| FR-TYPE-04 | **Space** moves to the next word, even when the typed word is wrong. It does nothing when no letter has been typed for the word, so no word can be skipped.                                          |
| FR-TYPE-05 | At a paragraph's last word, **Space** does nothing and the typing box shows "Press Enter for a new paragraph."; **Enter** moves to the next paragraph. Anywhere else, Enter does nothing.            |
| FR-TYPE-06 | **Backspace** removes the last letter of the word being typed. It never goes back into an earlier word.                                                                                              |
| FR-TYPE-07 | The attempt finishes by itself as soon as the last word has as many letters as the model word; Space is not needed.                                                                                  |
| FR-TYPE-08 | When the attempt is finished early (Finish or the time limit), a half-typed word counts only if it has all its letters; otherwise it is left out and is not a mistake.                               |
| FR-TYPE-09 | Paste, drag and drop, and autocorrect insertions are refused in the typing box.                                                                                                                      |
| FR-TYPE-10 | With an input method (such as Avro), the letters count when composition ends, and are compared like any others.                                                                                      |
| FR-TYPE-11 | On Windows, AltGr types a character rather than acting as a shortcut, and an Alt + number pad code types its one character, not the digits of the code.                                              |
| FR-TYPE-12 | Shortcuts while typing: **Esc** pauses and resumes, **Ctrl/Cmd + Enter** restarts, **Ctrl/Cmd + Space** reads the current word aloud.                                                                |
| FR-TYPE-13 | When Caps Lock is on, the typing box shows "Caps Lock is on".                                                                                                                                        |
| FR-TYPE-14 | The typing box shows what was typed, and keeps the line being typed and the three lines before it in view.                                                                                           |
| FR-TYPE-15 | The model answer box keeps the line of the current word in the middle. If the learner scrolls away to read ahead, the next key, a click in the typing box or the cursor moving there brings it back. |
| FR-TYPE-16 | Whenever the typing box is on screen, the cursor is in it: when the page loads, after **Try again** or **Restart**, and when a dialog closes.                                                        |

### 6.2 Comparing (COMPARE)

| ID            | Requirement                                                                                                                                                                                                |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-COMPARE-01 | A typed word is correct only when it is exactly the model word, capital letters and punctuation included.                                                                                                  |
| FR-COMPARE-02 | A wrong word gets one kind, decided in this order: **spelling** if its letters and digits differ (ignoring case and punctuation), else **capital letters** if only the case differs, else **punctuation**. |
| FR-COMPARE-03 | Letters and digits of any script count as letters for FR-COMPARE-02.                                                                                                                                       |
| FR-COMPARE-04 | While a word is typed, each of its letters in the model answer shows as correct, wrong or not typed yet.                                                                                                   |
| FR-COMPARE-05 | Letters typed past the model word's length are not drawn inside the model answer; a count such as "+2" after the word says how many there are, also to screen readers.                                     |
| FR-COMPARE-06 | A wrong word is shown in the mistake colour with a dotted underline, in both boxes, so colour is never the only sign.                                                                                      |
| FR-COMPARE-07 | A correct word already typed is shown in a quieter colour in the model answer.                                                                                                                             |

### 6.3 Timer (TIMER)

| ID          | Requirement                                                                                                                                                                                                    |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-TIMER-01 | The timer starts with the first key that changes the typed text; a refused key doesn't start it.                                                                                                               |
| FR-TIMER-02 | The status line shows the time, the words typed out of the total, a progress bar, **Restart** and **Finish**. There is no live WPM or accuracy while typing.                                                   |
| FR-TIMER-03 | Without a time limit the time counts up. With one, the time left counts down and turns red and bold in the last two minutes.                                                                                   |
| FR-TIMER-04 | The attempt pauses on **Esc** (after the first key), when the typing box loses focus, and when the window or the tab loses focus. Paused time is not counted.                                                  |
| FR-TIMER-05 | While paused, a notice over the boxes says "Paused. The timer is stopped. Type the next word to go on." with a **Resume** button that puts the cursor back in the typing box. The next typed key also resumes. |
| FR-TIMER-06 | The time limit is No limit (default), 20 minutes or 40 minutes, and is saved as a setting.                                                                                                                     |
| FR-TIMER-07 | Changing the limit before the first key applies it at once. After the first key, a dialog asks "Restart with the new time limit?" and says the attempt won't be saved.                                         |
| FR-TIMER-08 | An attempt keeps the limit it started with; a limit changed in another tab applies from the next attempt.                                                                                                      |
| FR-TIMER-09 | When the time limit runs out, the attempt finishes as with **Finish** (FR-TYPE-08).                                                                                                                            |
| FR-TIMER-10 | **Finish** with no word typed starts the attempt over; nothing is shown or saved.                                                                                                                              |
| FR-TIMER-11 | **Restart**, **Ctrl/Cmd + Enter** and opening another answer drop the unfinished attempt without saving it.                                                                                                    |
| FR-TIMER-12 | Leaving or reloading the page during an attempt (typing or paused) asks the browser's confirmation first.                                                                                                      |

### 6.4 Sound (SOUND)

| ID          | Requirement                                                                                                                                                                                                                                       |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-SOUND-01 | Sound is on by default. The speaker button in the top bar turns it on and off, and the choice is saved.                                                                                                                                           |
| FR-SOUND-02 | With sound on, the word to type is read aloud when typing starts, on every new word and again after a pause.                                                                                                                                      |
| FR-SOUND-03 | **Ctrl/Cmd + Space** reads the current word aloud again, also with sound off.                                                                                                                                                                     |
| FR-SOUND-04 | A new word stops the one being read, so no queue builds up.                                                                                                                                                                                       |
| FR-SOUND-05 | Only letters, digits, apostrophes, hyphens and % are read; other punctuation is left out.                                                                                                                                                         |
| FR-SOUND-06 | Speech uses the browser's own English voices. The default is the first British English (en-GB) voice, else the first English one. A saved voice that no longer exists falls back to the default.                                                  |
| FR-SOUND-07 | In the voice list, a voice whose name doesn't say its language is shown with its language code, such as "Daniel (en-GB)".                                                                                                                         |
| FR-SOUND-08 | Voice speed is Slow, Normal (default) or Fast, and is saved as a setting.                                                                                                                                                                         |
| FR-SOUND-09 | Without speech support in the browser, the speaker button is disabled and its tooltip says "Sound isn't supported in this browser."; everything else works. Without English voices, the voice list is disabled and says "No English voice found". |

### 6.5 Importing answers (IMPORT)

| ID           | Requirement                                                                                                                                                                                                                                                                                                                                                                       |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-IMPORT-01 | **Get answers from AI** opens a dialog with three steps and the prompt (read only). With no day in the Library, step 2 says to write **Start Day 1**, then **Start Day 2** the next day; otherwise it says to write **Start Day N**, where N is one after the newest day.                                                                                                         |
| FR-IMPORT-02 | **Copy prompt** copies the prompt and says "Prompt copied". If the browser refuses, the prompt is selected and the message says to press Ctrl/Cmd + C.                                                                                                                                                                                                                            |
| FR-IMPORT-03 | **Open in ChatGPT** opens ChatGPT in a new tab with the prompt already filled in.                                                                                                                                                                                                                                                                                                 |
| FR-IMPORT-04 | **Paste the reply** closes the dialog and opens the Paste dialog.                                                                                                                                                                                                                                                                                                                 |
| FR-IMPORT-05 | The Paste dialog starts empty every time it opens, with the cursor in the answer field.                                                                                                                                                                                                                                                                                           |
| FR-IMPORT-06 | A reply is read by its markers, each on a line of its own: `=== DAY N ===` and `=== TASK 1 QUESTION ===`, `ANSWER` or `VOCABULARY` (and the same for Task 2). Case and extra spaces don't matter. Text before the first marker is ignored, and only the first DAY marker counts.                                                                                                  |
| FR-IMPORT-07 | A code fence around an answer is removed. Vocabulary lines have the form `- phrase: meaning`, split at the first colon; other lines are ignored. A task with an empty answer is left out.                                                                                                                                                                                         |
| FR-IMPORT-08 | Text without a usable marker is one plain answer. Its Markdown is removed: code fence lines, heading marks (`#`), a `-` or `>` at the start of a line, and bold marks (`**`, `__`).                                                                                                                                                                                               |
| FR-IMPORT-09 | Every answer, question and vocabulary item is cleaned before it is saved: line breaks are made the same, curly quotes become straight, en and em dashes become a hyphen, "…" becomes "...", tabs and non-breaking spaces become spaces, repeated spaces become one, each line is trimmed, more than one blank line becomes one, and blank lines at the start and end are removed. |
| FR-IMPORT-10 | For an AI reply, the dialog shows what was found, such as "Day 3: Task 1, 172 words · Task 2, 268 words", and the button says which task starts, such as **Save and start Task 1**.                                                                                                                                                                                               |
| FR-IMPORT-11 | A task whose text is already in the Library is not saved again, and the dialog says so: "Task 1 is already in your library. Only Task 2 will be saved." or "Both tasks are already in your library."                                                                                                                                                                              |
| FR-IMPORT-12 | An imported answer is titled "Day 3 · Task 1", or "Task 1" when the reply has no day. Its question, vocabulary and day are kept.                                                                                                                                                                                                                                                  |
| FR-IMPORT-13 | For a plain answer, the dialog shows its word count, an optional title and a choice of Task 1 or Task 2 (default Task 2). Without a title, the answer's first six words become its title.                                                                                                                                                                                         |
| FR-IMPORT-14 | An answer with characters outside printable ASCII, line breaks and £ shows "Some characters may be hard to type on an English keyboard." It can still be saved.                                                                                                                                                                                                                   |
| FR-IMPORT-15 | Saving refuses an empty answer ("Paste an answer first.") and any answer over 2,000 words ("Answers can be up to 2,000 words."); then nothing is saved.                                                                                                                                                                                                                           |
| FR-IMPORT-16 | When every answer pasted is already in the Library, nothing is saved, the dialog says "This answer is already in your library." and offers **Open it**.                                                                                                                                                                                                                           |
| FR-IMPORT-17 | After saving, the dialog closes and the first answer saved is loaded. When the browser stored it, "Answer saved" or "Answers saved" is shown.                                                                                                                                                                                                                                     |

### 6.6 Library (LIBRARY)

| ID            | Requirement                                                                                                                                                                                                                                                                                           |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-LIBRARY-01 | **Library** opens a side panel with every answer and their number ("12 answers").                                                                                                                                                                                                                     |
| FR-LIBRARY-02 | Answers are grouped by day, newest day first; inside a day Task 1 comes before Task 2, and of two answers for the same task the newer comes first. Answers without a day come last, under "Other answers".                                                                                            |
| FR-LIBRARY-03 | Each row shows the title, then the task, the word count and the last accuracy ("Last 89%") or "Not practised yet".                                                                                                                                                                                    |
| FR-LIBRARY-04 | The answer open now has a green bar and background, and its row says "Open now".                                                                                                                                                                                                                      |
| FR-LIBRARY-05 | When the learner practised on at least one of the last seven days, the panel says on how many ("Practised on 4 of the last 7 days"), and adds the streak ("· 3 days in a row") from two days up. Days follow the learner's own time zone, and a day not practised yet today doesn't break the streak. |
| FR-LIBRARY-06 | The daily order is Day 1 Task 1, Day 1 Task 2, Day 2 Task 1 and so on; answers without a day are not part of it. **Up next** offers the first answer of the daily order with no attempt yet, unless it is the one open now.                                                                           |
| FR-LIBRARY-07 | Clicking a row loads that answer and closes the panel. Loading the answer whose Result is on screen starts it again.                                                                                                                                                                                  |
| FR-LIBRARY-08 | **Rename** turns the row into a title field. Enter or ✓ saves; ✕ or Esc cancels without closing the panel. An empty or unchanged title keeps the old one.                                                                                                                                             |
| FR-LIBRARY-09 | **Delete** asks "Delete this answer?" and says its practice history will be deleted too. Confirming deletes the answer and all its attempts, and says "Answer deleted".                                                                                                                               |
| FR-LIBRARY-10 | Deleting the answer open now loads the newest remaining answer, or the empty state when none is left.                                                                                                                                                                                                 |
| FR-LIBRARY-11 | With no answers, the panel says "No answers yet. Paste one to start.", and the page shows an empty state with **Get answers from AI** and **Paste answer**.                                                                                                                                           |
| FR-LIBRARY-12 | **Export** downloads every answer and attempt as one JSON file named with the learner's date, such as `copylekha-2026-11-26.json`. The file also holds the data version and the time of the export. It is made in the browser; nothing is sent to a server.                                           |

### 6.7 Result (RESULT)

| ID           | Requirement                                                                                                                                                                                                                    |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| FR-RESULT-01 | When an attempt finishes, the Result replaces the two boxes. Its heading is "Result" when every word was typed, else "Incomplete attempt".                                                                                     |
| FR-RESULT-02 | It shows four figures: WPM, accuracy, time (paused time left out) and words typed out of the total.                                                                                                                            |
| FR-RESULT-03 | Accuracy is the correct words out of the words typed, as a whole percentage; 0 when no word was typed.                                                                                                                         |
| FR-RESULT-04 | WPM counts each correct word's letters plus one space, divided by 5, per minute of active time. An attempt shorter than one second counts as one second.                                                                       |
| FR-RESULT-05 | It compares the accuracy with the last attempt on the same answer, complete or not ("Last time 82%, this time 89%"), or says "First attempt on this answer".                                                                   |
| FR-RESULT-06 | From the second attempt on, it says "New best accuracy on this answer" when the accuracy beats every earlier one, else "Your best on this answer: 91%".                                                                        |
| FR-RESULT-07 | It shows the number of mistakes of each kind (spelling, capital letters, punctuation), then either "No mistakes in this attempt." or a table of each wrong word: the correct word, what was typed and its kind, in text order. |
| FR-RESULT-08 | It lists the answer's vocabulary. A phrase with a mistake on one of its words, where it appears in the answer, is highlighted and says "(mistake here)". A mistake on the same word elsewhere doesn't count.                   |
| FR-RESULT-09 | **Try again** has the focus, so Enter starts the same answer again.                                                                                                                                                            |
| FR-RESULT-10 | When the answer has a next one in the daily order, **Start Day 3 · Task 2** (its title) loads it. **Choose another answer** opens the Library.                                                                                 |
| FR-RESULT-11 | After a sample answer, the Result suggests getting a new Task 1 and Task 2 every day, with **Get answers from AI**.                                                                                                            |

### 6.8 Settings (SETTINGS)

| ID             | Requirement                                                                                                                                                                                                                               |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-SETTINGS-01 | The Settings button in the top bar opens theme, text size, voice and voice speed. Every change is saved at once.                                                                                                                          |
| FR-SETTINGS-02 | Theme is System (default), Light or Dark. The saved theme is applied before the page is drawn, so it never flashes the wrong one.                                                                                                         |
| FR-SETTINGS-03 | Text size is 16 to 28 px in steps of 2 (default 20), for both boxes.                                                                                                                                                                      |
| FR-SETTINGS-04 | **Hide question** and **Show question** above the model answer hide and show the task question; the choice is saved (shown by default). Nothing is shown for an answer without a question. A long question scrolls after about six lines. |
| FR-SETTINGS-05 | The settings controls are disabled until the saved settings are read.                                                                                                                                                                     |
| FR-SETTINGS-06 | A setting changed in another tab applies here too.                                                                                                                                                                                        |

### 6.9 Storage (STORAGE)

| ID            | Requirement                                                                                                                                                                                                                           |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-STORAGE-01 | Answers, attempts, settings and the answer opened last are kept in the browser's localStorage, under keys that start with `copylekha.`. Nothing is sent to a server.                                                                  |
| FR-STORAGE-02 | Stored data is read after the page loads; until then a loading placeholder is shown.                                                                                                                                                  |
| FR-STORAGE-03 | Every finished attempt with at least one word typed is saved, newest first. Past 1,000 attempts the oldest are dropped.                                                                                                               |
| FR-STORAGE-04 | When the storage is full while saving an attempt, the 100 oldest attempts are dropped and the save is tried once more. If it still fails, the Result says "This result couldn't be saved. Your browser storage is full."              |
| FR-STORAGE-05 | Any other failed save keeps the change in memory for this visit. A failed attempt save says "This result couldn't be saved." on the Result, and after any failed save the page says "Some changes couldn't be saved in this browser." |
| FR-STORAGE-06 | When the browser can't store data at all, the app works for this visit and says "Your progress won't be saved in this browser."                                                                                                       |
| FR-STORAGE-07 | A stored value that can't be read is reset, for that key only. A stored answer or attempt of the wrong shape is ignored, and a wrong setting falls back to its default.                                                               |
| FR-STORAGE-08 | Changes made in another tab (answers, attempts, settings) appear here. The answer open here stays open, even when another tab opens a different one.                                                                                  |
| FR-STORAGE-09 | When another tab deletes the answer open here, another answer is shown and the page says "This answer was deleted in another tab."                                                                                                    |
| FR-STORAGE-10 | The data has a version number (now 1). A change to its shape needs a new version and a migration. A newer version than the app knows is read as it is and never lowered.                                                              |

### 6.10 Onboarding (ONBOARDING)

| ID               | Requirement                                                                                                                                                                                                                                                                   |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-ONBOARDING-01 | A first visit is a browser with no stored CopyLekha data. It adds two sample answers written for the project (one Task 1, one Task 2, each with a question and vocabulary) and loads the Task 2 sample. The samples can be deleted like any answer.                           |
| FR-ONBOARDING-02 | On the first visit How it works opens by itself, once. It has no close button, ignores Esc and clicks outside, and its only button is **Show me around**, which keeps the focus.                                                                                              |
| FR-ONBOARDING-03 | Later, How it works opens from the footer as a normal dialog, with **Show me around** and **Start practising**.                                                                                                                                                               |
| FR-ONBOARDING-04 | The guided tour shows one step at a time next to its control, which is outlined and scrolled into view: "1 of 6", a title and one sentence. **Next** has the focus; **Back**, **Skip tour** and the arrow keys also work. Steps whose control isn't on the page are left out. |
| FR-ONBOARDING-05 | When the tour ends, the cursor is in the typing box.                                                                                                                                                                                                                          |
| FR-ONBOARDING-06 | On a small screen the page says "CopyLekha works best on a computer with a keyboard."                                                                                                                                                                                         |

### 6.11 Analytics (ANALYTICS)

| ID              | Requirement                                                                                                                                                                                                                                                       |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-ANALYTICS-01 | Usage is counted with Umami (no cookies), only in production builds that have an Umami website id. Local runs and forks send nothing.                                                                                                                             |
| FR-ANALYTICS-02 | The only events are: `practice_start` (task) on the first key of an attempt; `practice_finish` (task, complete) when an attempt finishes; `answer_import` (source: `ai-import` or `manual`, count: 1 or 2) when answers are saved; `prompt_copy`; `open_chatgpt`. |
| FR-ANALYTICS-03 | An event never carries answer text, typed text, a title or anything personal.                                                                                                                                                                                     |
| FR-ANALYTICS-04 | A failure in the analytics script never affects practice.                                                                                                                                                                                                         |
| FR-ANALYTICS-05 | The About text says usage is counted only in builds that count it.                                                                                                                                                                                                |

## 7. Non-functional requirements

### 7.1 Accessibility

| ID            | Requirement                                                                                                                                                                                                            |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NFR-ACCESS-01 | Everything can be done with the keyboard alone, and the focus is always visible.                                                                                                                                       |
| NFR-ACCESS-02 | Controls are real buttons and links, and every field has a label. The typing box is labelled "Type the answer here" and the model answer is a region labelled "Model answer".                                          |
| NFR-ACCESS-03 | A dialog keeps the focus inside it while open. When it closes, the focus goes back to the typing box if it is on screen; How it works hands it to the guided tour, and a delete in the Library leaves it in the panel. |
| NFR-ACCESS-04 | Text has a contrast of at least 4.5:1 in both themes.                                                                                                                                                                  |
| NFR-ACCESS-05 | Colour is never the only sign: a wrong word also has a dotted underline, a vocabulary phrase with a mistake says "(mistake here)", and the open answer in the Library says "Open now".                                 |
| NFR-ACCESS-06 | Messages that appear by themselves (paused, Caps Lock, Enter needed, what a reply contains) are announced to screen readers, and a link that opens a new tab says so.                                                  |
| NFR-ACCESS-07 | Animations and smooth scrolling are turned off when the system asks for less motion.                                                                                                                                   |
| NFR-ACCESS-08 | Automated accessibility checks (axe) find no violations in the main flows, at 1280 px and 375 px wide, in the light and dark themes.                                                                                   |

### 7.2 Privacy

| ID             | Requirement                                                                                                      |
| -------------- | ---------------------------------------------------------------------------------------------------------------- |
| NFR-PRIVACY-01 | There is no account and no server. Answers, attempts and settings stay in the learner's browser.                 |
| NFR-PRIVACY-02 | Nothing the learner types or pastes is sent anywhere; usage counting follows FR-ANALYTICS-01 to FR-ANALYTICS-03. |
| NFR-PRIVACY-03 | The app sets no cookies, and never writes answer text, typed text or stored data to the console.                 |

### 7.3 Performance

| ID          | Requirement                                                                                                                         |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| NFR-PERF-01 | A key press feels instant on an answer of up to 2,000 words: only the words whose state changed are drawn again.                    |
| NFR-PERF-02 | An answer is split into words once when it is loaded, not on every key, and each typed word is compared once, when it is committed. |
| NFR-PERF-03 | The time on screen is updated four times a second while typing, and not at all while paused.                                        |

### 7.4 Platform

| ID              | Requirement                                                                                                                                                                                                                                                                                                                           |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NFR-PLATFORM-01 | The app is a static site (Next.js static export) and can be hosted on any static host; the live site is on Vercel.                                                                                                                                                                                                                    |
| NFR-PLATFORM-02 | It is made for current desktop browsers on a computer with a physical keyboard. Automated tests run in Chromium.                                                                                                                                                                                                                      |
| NFR-PLATFORM-03 | Phones can open it and the layout fits 375 px without sideways scrolling, but typing on them is not a goal.                                                                                                                                                                                                                           |
| NFR-PLATFORM-04 | Sound depends on the browser's speech support; without it, everything else works (FR-SOUND-09).                                                                                                                                                                                                                                       |
| NFR-PLATFORM-05 | Every push and pull request runs lint, the format check, the type check, the unit tests, the build and the end-to-end flows with the accessibility checks.                                                                                                                                                                            |
| NFR-PLATFORM-06 | The build needs no environment variable. Optional, and public in the built files: `NEXT_PUBLIC_UMAMI_WEBSITE_ID` (turns usage counting on), `NEXT_PUBLIC_UMAMI_SCRIPT_URL` (a self-hosted Umami) and `NEXT_PUBLIC_SITE_URL` (the site's address, needed for working share-image links; in production `https://copylekha.vercel.app`). |

## 8. UI and UX

### 8.1 Layout

The page is one column, at most 980 px wide and centred. From top to bottom:

1. **Notices**, only when needed: no storage, a change that couldn't be saved, the small-screen message.
2. **Top bar:** the CopyLekha name, the open answer's task and title, then Paste, Get answers from AI, Library, Sound, the time limit (No limit, 20 min, 40 min) and Settings. Paste and Library show only their icon, with the name in a tooltip, so the bar fits on one line from 1024 px up.
3. **Status line:** time, words typed, progress bar, Restart and Finish.
4. **Task question**, with Show question / Hide question.
5. **Model answer box:** seven lines tall, with the current line in the middle, three lines before and three ahead.
6. **Typing box:** four lines tall, showing the line being typed and the three before it.
7. **Shortcut line:** Space next word · Enter new paragraph · Esc pause · Ctrl/Cmd + Enter restart · Ctrl/Cmd + Space hear the word.
8. **Footer:** Built by Hossain. Bangladesh. · How it works · About.

The Result takes the place of the status line, the question, the two boxes and the shortcut line. When the result couldn't be saved, a notice says so just above it (FR-STORAGE-04, FR-STORAGE-05).

### 8.2 Focus mode

While the learner types, the top bar, the question and the shortcut line fade to 40% opacity, so the eyes stay on the text. The mouse or the keyboard focus brings a part back at once, and a pause brings it all back. Nothing fades while the guided tour runs.

### 8.3 Screen states

| State       | What is shown                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------ |
| Loading     | A placeholder in the shape of the boxes, until the stored data is read.                                                  |
| Empty       | "Add your first model answer", with Get answers from AI and Paste answer.                                                |
| Ready       | The two boxes; the typing box shows a placeholder that explains what to do and that the timer starts with the first key. |
| Typing      | The current word underlined, its sentence softly marked, focus mode on.                                                  |
| Paused      | The text stays readable, with the paused notice and Resume over the boxes.                                               |
| Result      | The Result in place of the boxes.                                                                                        |
| First visit | How it works, then the guided tour.                                                                                      |

Short confirmations ("Answer saved", "Answer deleted", "Prompt copied") appear as small messages that go away by themselves.

### 8.4 Colour and type

| Role                                                  | Light                 | Dark                  |
| ----------------------------------------------------- | --------------------- | --------------------- |
| Page background                                       | `#fafaf9`             | `#0f1012`             |
| Main text                                             | `#1a1c1f`             | `#e8eaed`             |
| Box and card                                          | `#ffffff`             | `#17191c`             |
| Accent: current-word underline, main button, accuracy | `#17834a`             | `#5bd08a`             |
| Mistake                                               | `#d03030`             | `#ff7b7b`             |
| Words not typed yet                                   | `#4a5058`             | `#c9cdd3`             |
| Correct words already typed                           | `#646b77`             | `#868c95`             |
| Notice background / text                              | `#fef3c7` / `#78350f` | `#3a2e0a` / `#fcd34d` |
| Sentence being typed                                  | `#f4f5f7`             | `#1f2226`             |
| Selected (time limit, open answer)                    | `#e2f2e8` / `#0f5f35` | `#173322` / `#6fdc9a` |

The font is Inter. Both boxes use a line height of 1.6 and the text size from Settings.

### 8.5 Keyboard shortcuts

| Where             | Key              | Action                                     |
| ----------------- | ---------------- | ------------------------------------------ |
| Typing box        | Space            | Next word                                  |
| Typing box        | Enter            | New paragraph (at a paragraph's last word) |
| Typing box        | Backspace        | Remove a letter of the current word        |
| Typing box        | Esc              | Pause or resume                            |
| Typing box        | Ctrl/Cmd + Enter | Restart                                    |
| Typing box        | Ctrl/Cmd + Space | Hear the current word                      |
| Result            | Enter            | Try again (it has the focus)               |
| Guided tour       | Enter, → / ←     | Next / back                                |
| Library, renaming | Enter / Esc      | Save / cancel the new title                |

### 8.6 Wording

All text in the app is in English, in sentence case and plain words. It speaks to the learner directly and avoids jargon (for example "Capital letters", not "Case").

## 9. Data model and storage

The source of truth for these shapes is `frontend/src/lib/types.ts`. Changing a stored shape needs a new storage version and a migration (FR-STORAGE-10).

### 9.1 Answer

| Field        | Type                                    | Meaning                                                                |
| ------------ | --------------------------------------- | ---------------------------------------------------------------------- |
| `id`         | string                                  | A random UUID.                                                         |
| `title`      | string                                  | For example "Day 3 · Task 1", or the first six words of the answer.    |
| `task`       | `"task1"` or `"task2"`                  | Which IELTS Writing task it is.                                        |
| `text`       | string                                  | The cleaned answer (FR-IMPORT-09): what is shown, typed and compared.  |
| `question`   | string or null                          | The task question, when the answer came with one.                      |
| `vocabulary` | list of `{ phrase, meaning }`           | Empty for an answer pasted by hand.                                    |
| `day`        | number or null                          | The day of the AI chat; null for a sample or an answer pasted by hand. |
| `source`     | `"sample"`, `"manual"` or `"ai-import"` | Where the answer came from.                                            |
| `createdAt`  | ISO date string                         | When it was saved.                                                     |

### 9.2 Attempt

| Field        | Type                                       | Meaning                                                                                                                                 |
| ------------ | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| `id`         | string                                     | A random UUID.                                                                                                                          |
| `answerId`   | string                                     | The answer it was typed on.                                                                                                             |
| `finishedAt` | ISO date string                            | When it finished; used for the practice days and the streak.                                                                            |
| `durationMs` | number                                     | Active time; paused time is left out.                                                                                                   |
| `timeLimit`  | `0`, `20` or `40`                          | The limit the attempt ran with, in minutes; 0 means no limit.                                                                           |
| `wordsTyped` | number                                     | Words typed, including wrong ones.                                                                                                      |
| `wordsTotal` | number                                     | Words in the answer.                                                                                                                    |
| `complete`   | boolean                                    | Every word was typed.                                                                                                                   |
| `wpm`        | number                                     | FR-RESULT-04.                                                                                                                           |
| `accuracy`   | number                                     | 0 to 100 (FR-RESULT-03).                                                                                                                |
| `errors`     | list of `{ index, expected, typed, kind }` | Each wrong word: its position in the answer, the correct word, what was typed and its kind (`"spelling"`, `"case"` or `"punctuation"`). |

An attempt in progress is never stored; only a finished one is.

### 9.3 Settings

| Field          | Type                              | Default                                 |
| -------------- | --------------------------------- | --------------------------------------- |
| `theme`        | `"system"`, `"light"` or `"dark"` | `"system"`                              |
| `sound`        | boolean                           | `true`                                  |
| `speed`        | `"slow"`, `"normal"` or `"fast"`  | `"normal"`                              |
| `voiceName`    | string or null                    | `null` (the default voice, FR-SOUND-06) |
| `fontSize`     | 16 to 28, in steps of 2           | `20`                                    |
| `timeLimit`    | `0`, `20` or `40`                 | `0`                                     |
| `showQuestion` | boolean                           | `true`                                  |

### 9.4 Storage keys

| Key                      | Holds                                                                                          |
| ------------------------ | ---------------------------------------------------------------------------------------------- |
| `copylekha.version`      | The storage version, now `1`.                                                                  |
| `copylekha.answers`      | Every answer, newest first.                                                                    |
| `copylekha.attempts`     | Every saved attempt, newest first, at most 1,000.                                              |
| `copylekha.settings`     | The settings.                                                                                  |
| `copylekha.lastAnswerId` | The answer opened last.                                                                        |
| `copylekha.theme`        | A copy of the theme kept by the theme library, read before the page is drawn (FR-SETTINGS-02). |

Every value except `copylekha.theme` (a plain string) is stored as JSON. The limits: 2,000 words per answer, 1,000 attempts in all.

## 10. Edge cases

Each case is specified in the requirement named after it.

| Case                                   | What happens                                                                      | Requirement               |
| -------------------------------------- | --------------------------------------------------------------------------------- | ------------------------- |
| The browser storage is full            | The oldest attempts make room, else the Result says the result couldn't be saved. | FR-STORAGE-04             |
| The browser can't store anything       | The app works for this visit and says progress won't be saved.                    | FR-STORAGE-06             |
| A stored value is broken               | That key is reset; bad items are ignored, bad settings fall back to defaults.     | FR-STORAGE-07             |
| The same answer is pasted again        | Nothing is saved; the learner can open the one already there.                     | FR-IMPORT-16              |
| One task of a reply is already saved   | Only the other task is saved, and the dialog says so.                             | FR-IMPORT-11              |
| An answer is over 2,000 words          | Nothing is saved.                                                                 | FR-IMPORT-15              |
| The text has characters hard to type   | A warning is shown; the answer can still be saved.                                | FR-IMPORT-14              |
| A reply has no markers                 | It is saved as one plain answer, without its Markdown.                            | FR-IMPORT-08              |
| The clipboard is blocked               | The prompt is selected for the learner to copy.                                   | FR-IMPORT-02              |
| Another tab deletes the open answer    | Another answer is shown, with a message.                                          | FR-STORAGE-09             |
| Another tab opens a different answer   | The answer open here stays open.                                                  | FR-STORAGE-08             |
| Another tab changes the time limit     | The attempt in progress keeps its limit.                                          | FR-TIMER-08               |
| The open answer is deleted here        | The newest answer loads, or the empty state.                                      | FR-LIBRARY-10             |
| Typing with an input method (Avro)     | The letters count when composition ends.                                          | FR-TYPE-10                |
| AltGr or an Alt + number pad code      | Types its character, not a shortcut or digits.                                    | FR-TYPE-11                |
| Space at a paragraph end               | Nothing happens; the box says to press Enter.                                     | FR-TYPE-05                |
| Letters past the end of a word         | Kept, shown as "+N" after the word.                                               | FR-TYPE-03, FR-COMPARE-05 |
| The last word                          | The attempt finishes without Space.                                               | FR-TYPE-07                |
| Finish with a half-typed word          | The word counts only if it has all its letters.                                   | FR-TYPE-08                |
| Finish with no word typed              | The attempt starts over; nothing is saved.                                        | FR-TIMER-10               |
| Leaving the page mid-attempt           | The browser asks first.                                                           | FR-TIMER-12               |
| A dialog opens mid-attempt             | The attempt pauses.                                                               | FR-TIMER-04               |
| Paste or drop into the typing box      | Refused.                                                                          | FR-TYPE-09                |
| No speech support, or no English voice | Sound or the voice list is disabled; the rest works.                              | FR-SOUND-09               |
| A saved voice is gone                  | The default voice is used.                                                        | FR-SOUND-06               |
| The Library is empty                   | The empty state offers both ways to add answers.                                  | FR-LIBRARY-11             |
| A phone                                | The page says it works best on a computer with a keyboard.                        | FR-ONBOARDING-06          |

## 11. Future ideas

Ideas for later versions. None of them is built yet, and they are in no order. Each one becomes requirements in section 6 when it is planned.

| Idea                   | What it does                                                                           | Note                                                                                                                            |
| ---------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `/progress` page       | accuracy and WPM over time, words often wrong, which kind of mistake is most common    |                                                                                                                                 |
| Drills on weak words   | short practice with only the words or sentences that were wrong                        |                                                                                                                                 |
| Memory mode            | the model answer hidden; write it from memory, then compare                            |                                                                                                                                 |
| Hint mode              | only the first letter of each word is shown                                            |                                                                                                                                 |
| Dictation mode         | the text hidden; type only from listening                                              |                                                                                                                                 |
| Sentence mode sound    | read the whole sentence when a new one starts; with Dictation mode                     |                                                                                                                                 |
| Spoken punctuation     | say "comma", "full stop"; with Dictation mode                                          |                                                                                                                                 |
| Fixing an earlier word | an option in Settings, off by default                                                  | Changes FR-TYPE-06, where Backspace never goes back into an earlier word.                                                       |
| AI feedback            | copy a summary of mistakes from the Result to paste into the learner's AI for feedback |                                                                                                                                 |
| `/library` page        | search, Task filter, how often practised, best accuracy, once there are many answers   |                                                                                                                                 |
| `/practice/[id]`       | a direct link to one answer                                                            |                                                                                                                                 |
| Cloud voices           | more natural speech; needs an API key and has a cost                                   | Sends each word to a voice service, against the non-goal of sending the learner's text to a server; it could only be an opt-in. |
| Login and cloud sync   | the same data on several devices; needs a server                                       | Changes NFR-PRIVACY-01 (no account, no server).                                                                                 |
| Import                 | restore the Library and attempts from an exported JSON file (export is FR-LIBRARY-12)  |                                                                                                                                 |
| Support link           | a donation link in About                                                               |                                                                                                                                 |

## Appendix A: The AI prompt

The prompt lives in `frontend/src/lib/ai-prompt.ts` and is shown in the Get answers from AI dialog. It is not copied here, so there is only one version of it.

**What it asks for**

- The AI acts as an IELTS Academic Writing examiner and coach, and replies to "Start Day N".
- **Task 1:** a realistic Academic Task 1 (bar chart, line graph, table, map or process) described in words, and a Band 8.5+ model answer of 160 to 180 words in four paragraphs: introduction, overview, body 1, body 2. Then 3 to 4 vocabulary items.
- **Task 2:** an Academic essay question whose type changes each day, and a Band 8.5+ model essay of 260 to 280 words: an introduction with a clear position, two body paragraphs, a conclusion. Then 4 to 5 vocabulary items.
- British spelling, plain text inside the answers, only characters found on a standard English keyboard, and no topic repeated from earlier days in the same chat.

**The reply format**

```text
=== DAY N ===

=== TASK 1 QUESTION ===
...
=== TASK 1 ANSWER ===
(the answer inside a code fence)
=== TASK 1 VOCABULARY ===
- phrase: meaning

=== TASK 2 QUESTION ===
...
=== TASK 2 ANSWER ===
(the answer inside a code fence)
=== TASK 2 VOCABULARY ===
- phrase: meaning
```

The code fence makes the AI chat show the answer as plain text, so it is copied exactly. How the reply is read is specified in FR-IMPORT-06 to FR-IMPORT-08.

**Changing the prompt**

The reply's format is what `frontend/src/lib/parse-ai-response.ts` reads. A change to the format needs the same change in the parser and its tests (`parse-ai-response.test.ts`, with the real reply in `parse-ai-response.fixture.txt`).
