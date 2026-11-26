import { createSampleAnswers, FIRST_VISIT_SAMPLE_TASK } from "@/lib/samples";
import { tokenize } from "@/lib/tokenize";
import { type Answer, type Attempt, type Settings, TASKS } from "@/lib/types";

// The only module that reads or writes CopyLekha's data in localStorage. (next-themes
// keeps its own copy of the theme under copylekha.theme; see ThemeProvider.tsx.)
// Nothing here throws: unavailable storage, a full quota and unreadable values are
// caught and turned into results. Every change takes the current data and returns the
// new data, so the app keeps working in memory even when nothing can be saved.

export const STORAGE_KEYS = {
  version: "copylekha.version",
  answers: "copylekha.answers",
  attempts: "copylekha.attempts",
  settings: "copylekha.settings",
  lastAnswerId: "copylekha.lastAnswerId",
} as const;

export const STORAGE_VERSION = 1;
export const MAX_ATTEMPTS = 1000;
export const MAX_ANSWER_WORDS = 2000;
// How many of the oldest attempts a quota error removes before the one retry.
export const QUOTA_RETRY_DROP = 100;

export const DEFAULT_SETTINGS: Settings = {
  theme: "system",
  sound: true,
  speed: "normal",
  voiceName: null,
  fontSize: 20,
  timeLimit: 0,
  showQuestion: true,
};

// Text size from 16 to 28 px in steps of 2.
export const MIN_FONT_SIZE = 16;
export const MAX_FONT_SIZE = 28;
export const FONT_SIZE_STEP = 2;

const AVAILABILITY_CHECK_KEY = "copylekha.availability-check";

export type StoreData = {
  answers: Answer[]; // newest first
  attempts: Attempt[]; // newest first
  settings: Settings;
  lastAnswerId: string | null;
};

export type LoadResult = StoreData & {
  // False when localStorage can't be used at all.
  isAvailable: boolean;
  // True only on the very first visit in this browser, when the samples are added.
  // Without storage every visit would look like the first, so it is false then.
  isFirstVisit: boolean;
};

// saved is false when the change could not be written; data holds it in memory anyway.
export type ChangeResult = {
  data: StoreData;
  saved: boolean;
};

export type AddAnswersResult =
  // added: the answers saved now, without those already in the Library.
  | ({ ok: true; added: Answer[] } & ChangeResult)
  | { ok: false; reason: "too-long" }
  | { ok: false; reason: "duplicate"; existingId: string };

// isStorageFull: the save failed because the quota is full, even after the retry.
export type AddAttemptResult = ChangeResult & { isStorageFull: boolean };

type WriteResult = "saved" | "quota" | "failed";

// ---- Checking stored values ------------------------------------------------------

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isString = (value: unknown): value is string => typeof value === "string";
const isNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);
const isBoolean = (value: unknown): value is boolean => typeof value === "boolean";

const isOneOf = <T extends string | number>(value: unknown, options: readonly T[]): value is T =>
  options.some((option) => option === value);

const SOURCES = ["sample", "manual", "ai-import"] as const;
const TIME_LIMITS = [0, 20, 40] as const;
const ERROR_KINDS = ["spelling", "case", "punctuation"] as const;
const THEMES = ["system", "light", "dark"] as const;
const SPEEDS = ["slow", "normal", "fast"] as const;

const isVocabularyItem = (value: unknown): boolean =>
  isRecord(value) && isString(value.phrase) && isString(value.meaning);

const isAnswer = (value: unknown): value is Answer =>
  isRecord(value) &&
  isString(value.id) &&
  isString(value.title) &&
  isOneOf(value.task, TASKS) &&
  isString(value.text) &&
  (value.question === null || isString(value.question)) &&
  Array.isArray(value.vocabulary) &&
  value.vocabulary.every(isVocabularyItem) &&
  (value.day === null || isNumber(value.day)) &&
  isOneOf(value.source, SOURCES) &&
  isString(value.createdAt);

const isAttemptError = (value: unknown): boolean =>
  isRecord(value) &&
  isNumber(value.index) &&
  isString(value.expected) &&
  isString(value.typed) &&
  isOneOf(value.kind, ERROR_KINDS);

const isAttempt = (value: unknown): value is Attempt =>
  isRecord(value) &&
  isString(value.id) &&
  isString(value.answerId) &&
  isString(value.finishedAt) &&
  isNumber(value.durationMs) &&
  isOneOf(value.timeLimit, TIME_LIMITS) &&
  isNumber(value.wordsTyped) &&
  isNumber(value.wordsTotal) &&
  isBoolean(value.complete) &&
  isNumber(value.wpm) &&
  isNumber(value.accuracy) &&
  Array.isArray(value.errors) &&
  value.errors.every(isAttemptError);

const isFontSize = (value: unknown): value is number =>
  isNumber(value) &&
  value >= MIN_FONT_SIZE &&
  value <= MAX_FONT_SIZE &&
  value % FONT_SIZE_STEP === 0;

// Each setting is checked on its own: a bad or missing one falls back to its default.
const toSettings = (value: unknown): Settings => {
  const stored = isRecord(value) ? value : {};

  return {
    theme: isOneOf(stored.theme, THEMES) ? stored.theme : DEFAULT_SETTINGS.theme,
    sound: isBoolean(stored.sound) ? stored.sound : DEFAULT_SETTINGS.sound,
    speed: isOneOf(stored.speed, SPEEDS) ? stored.speed : DEFAULT_SETTINGS.speed,
    voiceName:
      stored.voiceName === null || isString(stored.voiceName)
        ? stored.voiceName
        : DEFAULT_SETTINGS.voiceName,
    fontSize: isFontSize(stored.fontSize) ? stored.fontSize : DEFAULT_SETTINGS.fontSize,
    timeLimit: isOneOf(stored.timeLimit, TIME_LIMITS)
      ? stored.timeLimit
      : DEFAULT_SETTINGS.timeLimit,
    showQuestion: isBoolean(stored.showQuestion)
      ? stored.showQuestion
      : DEFAULT_SETTINGS.showQuestion,
  };
};

// ---- Reading and writing ---------------------------------------------------------

const isQuotaError = (error: unknown): boolean =>
  error instanceof DOMException &&
  (error.name === "QuotaExceededError" || error.name === "NS_ERROR_DOM_QUOTA_REACHED");

const checkAvailability = (): boolean => {
  try {
    localStorage.setItem(AVAILABILITY_CHECK_KEY, "1");
    localStorage.removeItem(AVAILABILITY_CHECK_KEY);
    return true;
  } catch {
    return false;
  }
};

const resetKey = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch {
    // Nothing more to do: the value is ignored either way.
  }
};

// Unreadable JSON resets that key only and is reported once, without its content.
const readJson = (key: string): unknown => {
  let raw: string | null;
  try {
    raw = localStorage.getItem(key);
  } catch {
    return null;
  }
  if (raw === null) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch {
    console.warn(`CopyLekha: the stored value of ${key} could not be read and was reset.`);
    resetKey(key);
    return null;
  }
};

const readList = <T>(key: string, isItem: (value: unknown) => value is T): T[] => {
  const value = readJson(key);
  return Array.isArray(value) ? value.filter(isItem) : [];
};

const writeJson = (key: string, value: unknown): WriteResult => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return "saved";
  } catch (error) {
    return isQuotaError(error) ? "quota" : "failed";
  }
};

// Several keys change together (for example an answer and its attempts).
const writeAll = (entries: [key: string, value: unknown][]): boolean =>
  entries.every(([key, value]) => writeJson(key, value) === "saved");

// ---- Loading ---------------------------------------------------------------------

// Reads what is stored, without writing anything; used again when another tab changes a key.
export const readStore = (): StoreData => {
  const lastAnswerId = readJson(STORAGE_KEYS.lastAnswerId);

  return {
    answers: readList(STORAGE_KEYS.answers, isAnswer),
    attempts: readList(STORAGE_KEYS.attempts, isAttempt),
    settings: toSettings(readJson(STORAGE_KEYS.settings)),
    lastAnswerId: isString(lastAnswerId) ? lastAnswerId : null,
  };
};

const hasStoredValue = (key: string): boolean => {
  try {
    return localStorage.getItem(key) !== null;
  } catch {
    return false;
  }
};

const createFirstVisitData = (): StoreData => {
  const answers = createSampleAnswers(new Date().toISOString());
  const firstAnswer = answers.find((answer) => answer.task === FIRST_VISIT_SAMPLE_TASK);

  return {
    answers,
    attempts: [],
    settings: DEFAULT_SETTINGS,
    lastAnswerId: firstAnswer === undefined ? null : firstAnswer.id,
  };
};

// Called once when the page loads. On the very first visit it adds the samples.
export const loadStore = (): LoadResult => {
  if (!checkAvailability()) {
    return { ...createFirstVisitData(), isAvailable: false, isFirstVisit: false };
  }

  const isFirstVisit =
    !hasStoredValue(STORAGE_KEYS.version) && !hasStoredValue(STORAGE_KEYS.answers);

  if (isFirstVisit) {
    const data = createFirstVisitData();
    writeAll([
      [STORAGE_KEYS.version, STORAGE_VERSION],
      [STORAGE_KEYS.answers, data.answers],
      [STORAGE_KEYS.lastAnswerId, data.lastAnswerId],
    ]);
    return { ...data, isAvailable: true, isFirstVisit: true };
  }

  // A newer version (the learner went back to an older build) is read as it is and
  // never lowered. Version 1 is the first, so there is no migration yet.
  const storedVersion = readJson(STORAGE_KEYS.version);
  if (!isNumber(storedVersion)) {
    writeJson(STORAGE_KEYS.version, STORAGE_VERSION);
  }

  return { ...readStore(), isAvailable: true, isFirstVisit: false };
};

// ---- Changes ---------------------------------------------------------------------

// Saves one answer, or the two answers of an AI reply. Nothing is saved
// when an answer is too long. An answer whose text is already in the Library is left
// out; when every answer is, nothing is saved.
export const addAnswers = (data: StoreData, newAnswers: Answer[]): AddAnswersResult => {
  if (newAnswers.some((answer) => tokenize(answer.text).length > MAX_ANSWER_WORDS)) {
    return { ok: false, reason: "too-long" };
  }

  const added = newAnswers.filter(
    (answer) => !data.answers.some((stored) => stored.text === answer.text),
  );
  if (added.length === 0) {
    const existing = data.answers.find((stored) =>
      newAnswers.some((answer) => answer.text === stored.text),
    );
    if (existing !== undefined) {
      return { ok: false, reason: "duplicate", existingId: existing.id };
    }
  }

  const answers = [...added, ...data.answers];
  return {
    ok: true,
    added,
    data: { ...data, answers },
    saved: writeAll([[STORAGE_KEYS.answers, answers]]),
  };
};

export const renameAnswer = (data: StoreData, id: string, title: string): ChangeResult => {
  const answers = data.answers.map((answer) => (answer.id === id ? { ...answer, title } : answer));

  return { data: { ...data, answers }, saved: writeAll([[STORAGE_KEYS.answers, answers]]) };
};

// Deleting an answer also deletes its attempts.
export const deleteAnswer = (data: StoreData, id: string): ChangeResult => {
  const answers = data.answers.filter((answer) => answer.id !== id);
  const attempts = data.attempts.filter((attempt) => attempt.answerId !== id);
  const lastAnswerId = data.lastAnswerId === id ? null : data.lastAnswerId;

  return {
    data: { ...data, answers, attempts, lastAnswerId },
    saved: writeAll([
      [STORAGE_KEYS.answers, answers],
      [STORAGE_KEYS.attempts, attempts],
      [STORAGE_KEYS.lastAnswerId, lastAnswerId],
    ]),
  };
};

// The newest attempt goes first; past MAX_ATTEMPTS the oldest are dropped.
// A full quota drops QUOTA_RETRY_DROP more of the oldest and tries once more.
export const addAttempt = (data: StoreData, attempt: Attempt): AddAttemptResult => {
  const attempts = [attempt, ...data.attempts].slice(0, MAX_ATTEMPTS);
  const firstTry = writeJson(STORAGE_KEYS.attempts, attempts);

  if (firstTry !== "quota") {
    return { data: { ...data, attempts }, saved: firstTry === "saved", isStorageFull: false };
  }

  // Keep at least the new attempt.
  const fewerAttempts = attempts.slice(0, Math.max(1, attempts.length - QUOTA_RETRY_DROP));
  const retry = writeJson(STORAGE_KEYS.attempts, fewerAttempts);
  return {
    data: { ...data, attempts: fewerAttempts },
    saved: retry === "saved",
    isStorageFull: retry === "quota",
  };
};

export const saveSettings = (data: StoreData, settings: Settings): ChangeResult => ({
  data: { ...data, settings },
  saved: writeAll([[STORAGE_KEYS.settings, settings]]),
});

export const saveLastAnswerId = (data: StoreData, lastAnswerId: string): ChangeResult => ({
  data: { ...data, lastAnswerId },
  saved: writeAll([[STORAGE_KEYS.lastAnswerId, lastAnswerId]]),
});

// ---- Export ----------------------------------------------------------------------

// What the Export button downloads: every answer and attempt, as they are stored.
// It is built here and saved by the browser; nothing is sent anywhere.
export type StoreExport = {
  app: "copylekha";
  version: number;
  exportedAt: string;
  answers: Answer[];
  attempts: Attempt[];
};

export const createExport = (
  data: Pick<StoreData, "answers" | "attempts">,
  now: Date,
): StoreExport => ({
  app: "copylekha",
  version: STORAGE_VERSION,
  exportedAt: now.toISOString(),
  answers: data.answers,
  attempts: data.attempts,
});

// "copylekha-2026-11-26.json", with the date in the learner's own time zone.
export const getExportFileName = (now: Date): string => {
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `copylekha-${now.getFullYear()}-${month}-${day}.json`;
};
