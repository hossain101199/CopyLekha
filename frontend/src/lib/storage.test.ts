import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  addAnswers,
  addAttempt,
  createExport,
  DEFAULT_SETTINGS,
  deleteAnswer,
  getExportFileName,
  loadStore,
  MAX_ANSWER_WORDS,
  MAX_ATTEMPTS,
  QUOTA_RETRY_DROP,
  readStore,
  renameAnswer,
  saveLastAnswerId,
  saveSettings,
  STORAGE_KEYS,
  STORAGE_VERSION,
  type StoreData,
} from "@/lib/storage";
import type { Answer, Attempt } from "@/lib/types";

const createAnswer = (id: string, text: string): Answer => ({
  id,
  title: `Answer ${id}`,
  task: "task2",
  text,
  question: null,
  vocabulary: [],
  day: null,
  source: "manual",
  createdAt: "2026-11-21T10:00:00.000Z",
});

const createAttempt = (id: string, answerId: string): Attempt => ({
  id,
  answerId,
  finishedAt: "2026-11-21T10:05:00.000Z",
  durationMs: 60_000,
  timeLimit: 0,
  wordsTyped: 3,
  wordsTotal: 3,
  complete: true,
  wpm: 30,
  accuracy: 100,
  errors: [],
});

const emptyData = (): StoreData => ({
  answers: [],
  attempts: [],
  settings: DEFAULT_SETTINGS,
  lastAnswerId: null,
});

const store = (key: string, value: unknown): void => {
  localStorage.setItem(key, JSON.stringify(value));
};

const stored = (key: string): unknown => {
  const raw = localStorage.getItem(key);
  return raw === null ? null : JSON.parse(raw);
};

const quotaError = (): DOMException =>
  new DOMException("The quota was exceeded.", "QuotaExceededError");

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("loadStore: first visit", () => {
  it("writes the version and adds the two samples", () => {
    const result = loadStore();

    expect(result.isAvailable).toBe(true);
    expect(result.isFirstVisit).toBe(true);
    expect(stored(STORAGE_KEYS.version)).toBe(STORAGE_VERSION);
    expect(result.answers.map((answer) => [answer.task, answer.source])).toEqual([
      ["task1", "sample"],
      ["task2", "sample"],
    ]);
    expect(stored(STORAGE_KEYS.answers)).toEqual(result.answers);
  });

  it("opens the Task 2 sample", () => {
    const result = loadStore();
    const task2 = result.answers.find((answer) => answer.task === "task2");

    expect(result.lastAnswerId).toBe(task2?.id);
    expect(stored(STORAGE_KEYS.lastAnswerId)).toBe(task2?.id);
  });

  it("starts with the default settings and no attempts", () => {
    const result = loadStore();

    expect(result.settings).toEqual(DEFAULT_SETTINGS);
    expect(result.attempts).toEqual([]);
  });

  it("never adds the samples again, even when the Library was emptied", () => {
    const first = loadStore();
    for (const answer of first.answers) {
      deleteAnswer(readStore(), answer.id);
    }

    expect(loadStore().answers).toEqual([]);
  });

  it("is the first visit only once", () => {
    loadStore();

    expect(loadStore().isFirstVisit).toBe(false);
  });
});

describe("loadStore: later visits", () => {
  it("reads what is stored", () => {
    const answer = createAnswer("a1", "The chart shows a rise.");
    const attempt = createAttempt("t1", "a1");
    const settings = { ...DEFAULT_SETTINGS, theme: "dark", fontSize: 24 };
    store(STORAGE_KEYS.version, STORAGE_VERSION);
    store(STORAGE_KEYS.answers, [answer]);
    store(STORAGE_KEYS.attempts, [attempt]);
    store(STORAGE_KEYS.settings, settings);
    store(STORAGE_KEYS.lastAnswerId, "a1");

    expect(loadStore()).toEqual({
      answers: [answer],
      attempts: [attempt],
      settings,
      lastAnswerId: "a1",
      isAvailable: true,
      isFirstVisit: false,
    });
  });

  it("writes a missing version without adding samples when answers are stored", () => {
    store(STORAGE_KEYS.answers, [createAnswer("a1", "Mine.")]);

    const result = loadStore();

    expect(result.answers.map((answer) => answer.id)).toEqual(["a1"]);
    expect(stored(STORAGE_KEYS.version)).toBe(STORAGE_VERSION);
  });

  it("never lowers a version newer than the app knows", () => {
    store(STORAGE_KEYS.version, STORAGE_VERSION + 1);
    store(STORAGE_KEYS.answers, []);

    loadStore();

    expect(stored(STORAGE_KEYS.version)).toBe(STORAGE_VERSION + 1);
  });
});

describe("loadStore: unreadable or broken values", () => {
  beforeEach(() => {
    store(STORAGE_KEYS.version, STORAGE_VERSION);
  });

  it("resets only the key with unreadable JSON and reports it once without its content", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    localStorage.setItem(STORAGE_KEYS.answers, "{not json");
    store(STORAGE_KEYS.settings, { ...DEFAULT_SETTINGS, sound: false });

    const result = loadStore();

    expect(result.answers).toEqual([]);
    expect(result.settings.sound).toBe(false);
    expect(localStorage.getItem(STORAGE_KEYS.answers)).toBeNull();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain(STORAGE_KEYS.answers);
    expect(warn.mock.calls[0][0]).not.toContain("not json");
  });

  it("leaves out stored items that don't have the right shape", () => {
    const good = createAnswer("a1", "Good.");
    store(STORAGE_KEYS.answers, [good, { id: "a2" }, "text", null]);
    store(STORAGE_KEYS.attempts, [
      createAttempt("t1", "a1"),
      { ...createAttempt("t2", "a1"), wpm: "fast" },
    ]);

    const result = loadStore();

    expect(result.answers).toEqual([good]);
    expect(result.attempts.map((attempt) => attempt.id)).toEqual(["t1"]);
  });

  it("treats a stored list that is not a list as empty", () => {
    store(STORAGE_KEYS.answers, { not: "a list" });

    expect(loadStore().answers).toEqual([]);
  });

  it("falls back to the default for each bad or missing setting only", () => {
    store(STORAGE_KEYS.settings, { theme: "dark", fontSize: 99, speed: "very fast", sound: "yes" });

    expect(loadStore().settings).toEqual({ ...DEFAULT_SETTINGS, theme: "dark" });
  });

  it("ignores a last answer id that is not a string", () => {
    store(STORAGE_KEYS.lastAnswerId, 42);

    expect(loadStore().lastAnswerId).toBeNull();
  });
});

describe("storage unavailable", () => {
  beforeEach(() => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Storage is disabled.", "SecurityError");
    });
  });

  it("says so and still gives the samples to practise with", () => {
    const result = loadStore();

    expect(result.isAvailable).toBe(false);
    // Every visit would look like the first, so How it works never opens by itself.
    expect(result.isFirstVisit).toBe(false);
    expect(result.answers).toHaveLength(2);
    expect(result.lastAnswerId).not.toBeNull();
  });

  it("keeps changes in memory when they can't be saved", () => {
    const result = addAnswers(emptyData(), [createAnswer("a1", "Kept in memory.")]);

    expect(result).toMatchObject({ ok: true, saved: false });
    expect(result.ok && result.data.answers.map((answer) => answer.id)).toEqual(["a1"]);
  });
});

describe("addAnswers: limits", () => {
  it("saves new answers first, newest first", () => {
    const data = { ...emptyData(), answers: [createAnswer("old", "An older answer.")] };

    const result = addAnswers(data, [
      createAnswer("t1", "Task one."),
      createAnswer("t2", "Task two."),
    ]);

    expect(result.ok && result.data.answers.map((answer) => answer.id)).toEqual([
      "t1",
      "t2",
      "old",
    ]);
    expect(result.ok && result.saved).toBe(true);
    expect(stored(STORAGE_KEYS.answers)).toEqual(result.ok ? result.data.answers : null);
  });

  it("accepts an answer of exactly the word limit", () => {
    const text = Array.from({ length: MAX_ANSWER_WORDS }, () => "word").join(" ");

    expect(addAnswers(emptyData(), [createAnswer("a1", text)]).ok).toBe(true);
  });

  it("refuses an answer over the word limit and saves nothing", () => {
    const text = Array.from({ length: MAX_ANSWER_WORDS + 1 }, () => "word").join(" ");

    expect(addAnswers(emptyData(), [createAnswer("a1", text)])).toEqual({
      ok: false,
      reason: "too-long",
    });
    expect(localStorage.getItem(STORAGE_KEYS.answers)).toBeNull();
  });

  it("saves the new task of a reply and leaves out the one already in the Library", () => {
    const data = { ...emptyData(), answers: [createAnswer("existing", "Task one.")] };

    const result = addAnswers(data, [
      createAnswer("t1", "Task one."),
      createAnswer("t2", "Task two."),
    ]);

    expect(result.ok && result.added.map((answer) => answer.id)).toEqual(["t2"]);
    expect(result.ok && result.data.answers.map((answer) => answer.id)).toEqual(["t2", "existing"]);
    expect(stored(STORAGE_KEYS.answers)).toEqual(result.ok && result.data.answers);
  });

  it("refuses a reply whose tasks are all in the Library and names the first one", () => {
    const data = {
      ...emptyData(),
      answers: [createAnswer("e1", "Task one."), createAnswer("e2", "Task two.")],
    };

    expect(
      addAnswers(data, [createAnswer("t1", "Task one."), createAnswer("t2", "Task two.")]),
    ).toEqual({ ok: false, reason: "duplicate", existingId: "e1" });
    expect(localStorage.getItem(STORAGE_KEYS.answers)).toBeNull();
  });

  it("refuses an answer whose text is already in the Library and names the existing one", () => {
    const data = { ...emptyData(), answers: [createAnswer("existing", "Same text.")] };

    expect(addAnswers(data, [createAnswer("new", "Same text.")])).toEqual({
      ok: false,
      reason: "duplicate",
      existingId: "existing",
    });
  });
});

describe("renameAnswer", () => {
  it("changes only that answer's title", () => {
    const data = {
      ...emptyData(),
      answers: [createAnswer("a1", "One."), createAnswer("a2", "Two.")],
    };

    const result = renameAnswer(data, "a2", "My essay");

    expect(result.data.answers.map((answer) => answer.title)).toEqual(["Answer a1", "My essay"]);
    expect(stored(STORAGE_KEYS.answers)).toEqual(result.data.answers);
  });
});

describe("deleteAnswer", () => {
  it("deletes the answer and its attempts, and keeps the others", () => {
    const data: StoreData = {
      ...emptyData(),
      answers: [createAnswer("a1", "One."), createAnswer("a2", "Two.")],
      attempts: [createAttempt("t1", "a1"), createAttempt("t2", "a2"), createAttempt("t3", "a1")],
      lastAnswerId: "a2",
    };

    const result = deleteAnswer(data, "a1");

    expect(result.data.answers.map((answer) => answer.id)).toEqual(["a2"]);
    expect(result.data.attempts.map((attempt) => attempt.id)).toEqual(["t2"]);
    expect(result.data.lastAnswerId).toBe("a2");
    expect(stored(STORAGE_KEYS.attempts)).toEqual(result.data.attempts);
  });

  it("forgets the last opened answer when it is the one deleted", () => {
    const data = { ...emptyData(), answers: [createAnswer("a1", "One.")], lastAnswerId: "a1" };

    expect(deleteAnswer(data, "a1").data.lastAnswerId).toBeNull();
  });
});

describe("addAttempt", () => {
  const manyAttempts = (count: number): Attempt[] =>
    Array.from({ length: count }, (_, position) => createAttempt(`old${position}`, "a1"));

  it("saves the attempt first, newest first", () => {
    const data = { ...emptyData(), attempts: [createAttempt("older", "a1")] };

    const result = addAttempt(data, createAttempt("newest", "a1"));

    expect(result.saved).toBe(true);
    expect(result.data.attempts.map((attempt) => attempt.id)).toEqual(["newest", "older"]);
    expect(stored(STORAGE_KEYS.attempts)).toEqual(result.data.attempts);
  });

  it("drops the oldest attempts past the limit", () => {
    const data = { ...emptyData(), attempts: manyAttempts(MAX_ATTEMPTS) };

    const result = addAttempt(data, createAttempt("newest", "a1"));

    expect(result.data.attempts).toHaveLength(MAX_ATTEMPTS);
    expect(result.data.attempts[0].id).toBe("newest");
    expect(result.data.attempts.at(-1)?.id).toBe(`old${MAX_ATTEMPTS - 2}`);
  });

  it("drops more of the oldest attempts after a quota error and tries once more", () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    setItem.mockImplementationOnce(() => {
      throw quotaError();
    });
    const data = { ...emptyData(), attempts: manyAttempts(300) };

    const result = addAttempt(data, createAttempt("newest", "a1"));

    expect(result.saved).toBe(true);
    expect(result.data.attempts).toHaveLength(301 - QUOTA_RETRY_DROP);
    expect(result.data.attempts[0].id).toBe("newest");
    expect(stored(STORAGE_KEYS.attempts)).toEqual(result.data.attempts);
  });

  it("reports a failed save when the retry fails too", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw quotaError();
    });

    const result = addAttempt(emptyData(), createAttempt("newest", "a1"));

    expect(result.saved).toBe(false);
    expect(result.isStorageFull).toBe(true);
    expect(result.data.attempts.map((attempt) => attempt.id)).toEqual(["newest"]);
  });

  it("reports a failed save that is not a full storage", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Blocked", "SecurityError");
    });

    const result = addAttempt(emptyData(), createAttempt("newest", "a1"));

    expect(result.saved).toBe(false);
    expect(result.isStorageFull).toBe(false);
  });
});

describe("settings and the last answer", () => {
  it("saves the settings", () => {
    const settings = { ...DEFAULT_SETTINGS, timeLimit: 40 as const };

    expect(saveSettings(emptyData(), settings).data.settings).toEqual(settings);
    expect(stored(STORAGE_KEYS.settings)).toEqual(settings);
  });

  it("saves the last opened answer", () => {
    expect(saveLastAnswerId(emptyData(), "a1").data.lastAnswerId).toBe("a1");
    expect(stored(STORAGE_KEYS.lastAnswerId)).toBe("a1");
  });
});

describe("export", () => {
  it("holds every answer and attempt with the version and the time", () => {
    const data: StoreData = {
      ...emptyData(),
      answers: [createAnswer("a2", "Second answer."), createAnswer("a1", "First answer.")],
      attempts: [createAttempt("t1", "a1")],
      lastAnswerId: "a1",
    };

    const result = createExport(data, new Date("2026-11-26T09:30:00.000Z"));

    expect(result).toEqual({
      app: "copylekha",
      version: STORAGE_VERSION,
      exportedAt: "2026-11-26T09:30:00.000Z",
      answers: data.answers,
      attempts: data.attempts,
    });
  });

  it("can be written as JSON and read back unchanged", () => {
    const data: StoreData = {
      ...emptyData(),
      answers: [createAnswer("a1", "First answer.")],
      attempts: [createAttempt("t1", "a1")],
    };

    const result = createExport(data, new Date("2026-11-26T09:30:00.000Z"));

    expect(JSON.parse(JSON.stringify(result))).toEqual(result);
  });

  it("writes nothing to storage", () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem");

    createExport(emptyData(), new Date("2026-11-26T09:30:00.000Z"));

    expect(setItem).not.toHaveBeenCalled();
  });

  it("names the file with the local date", () => {
    expect(getExportFileName(new Date(2026, 10, 26, 23, 59))).toBe("copylekha-2026-11-26.json");
    expect(getExportFileName(new Date(2027, 0, 5, 0, 0))).toBe("copylekha-2027-01-05.json");
  });
});
