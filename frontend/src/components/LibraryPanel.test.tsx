import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LibraryPanel } from "@/components/LibraryPanel";
import type { Answer, Attempt } from "@/lib/types";

const answer = (id: string, title: string, day: number | null, task: Answer["task"]): Answer => ({
  id,
  title,
  task,
  text: "Prices rose sharply.",
  question: null,
  vocabulary: [],
  day,
  source: day === null ? "manual" : "ai-import",
  createdAt: "2026-11-22T10:00:00.000Z",
});

// Newest first, as stored.
const ANSWERS = [
  answer("d2-t1", "Day 2 · Task 1", 2, "task1"),
  answer("d1-t2", "Day 1 · Task 2", 1, "task2"),
  answer("d1-t1", "Day 1 · Task 1", 1, "task1"),
  answer("manual", "My own answer", null, "task2"),
];

const ATTEMPTS: Attempt[] = [
  {
    id: "t1",
    answerId: "d1-t1",
    finishedAt: "2026-11-22T10:00:00.000Z",
    durationMs: 60_000,
    timeLimit: 0,
    wordsTyped: 3,
    wordsTotal: 3,
    complete: true,
    wpm: 30,
    accuracy: 85,
    errors: [],
  },
];

const setup = (currentAnswerId = "d1-t2") => {
  const user = userEvent.setup();
  const handlers = { onLoad: vi.fn(), onRename: vi.fn(), onDelete: vi.fn() };
  render(
    <LibraryPanel
      open
      onOpenChange={() => {}}
      answers={ANSWERS}
      attempts={ATTEMPTS}
      currentAnswerId={currentAnswerId}
      onCloseAutoFocus={() => {}}
      {...handlers}
    />,
  );
  return { user, ...handlers };
};

const titlesIn = (groupLabel: string) =>
  within(screen.getByRole("region", { name: groupLabel }))
    .getAllByRole("listitem")
    .map((item) => item.querySelector(".truncate")?.textContent);

afterEach(() => {
  cleanup();
});

describe("LibraryPanel: the list", () => {
  it("groups answers by day, newest day first, and Other answers last", () => {
    setup();

    const headings = screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);
    expect(headings).toEqual(["Day 2", "Day 1", "Other answers"]);
    expect(titlesIn("Day 1")).toEqual(["Day 1 · Task 1", "Day 1 · Task 2"]);
  });

  it("shows the task, word count and last accuracy", () => {
    setup();

    expect(screen.getByText("Task 1 · 3 words · Last 85%")).toBeTruthy();
    expect(screen.getAllByText("Task 2 · 3 words · Not practised yet")).toHaveLength(2);
  });

  it("marks the open answer and loads one when it is clicked", async () => {
    const { user, onLoad } = setup();

    const current = screen.getByRole("button", { name: /^Day 1 · Task 2/ });
    expect(current.getAttribute("aria-current")).toBe("true");
    // Said in words too, not by color alone.
    expect(current.textContent).toContain("Open now");
    expect(screen.getAllByText("· Open now")).toHaveLength(1);

    await user.click(screen.getByRole("button", { name: /^My own answer/ }));

    expect(onLoad).toHaveBeenCalledWith("manual");
  });
});

describe("LibraryPanel: rename", () => {
  it("saves a new title with Enter", async () => {
    const { user, onRename } = setup();
    await user.click(screen.getByRole("button", { name: "Rename My own answer" }));
    const input = screen.getByLabelText("New title");
    await user.clear(input);
    await user.type(input, "  Cars and buses {Enter}");

    expect(onRename).toHaveBeenCalledWith("manual", "Cars and buses");
    expect(screen.queryByLabelText("New title")).toBeNull();
  });

  it("keeps the old title when the new one is empty", async () => {
    const { user, onRename } = setup();
    await user.click(screen.getByRole("button", { name: "Rename My own answer" }));
    await user.clear(screen.getByLabelText("New title"));
    await user.click(screen.getByRole("button", { name: "Save title" }));

    expect(onRename).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /^My own answer/ })).toBeTruthy();
  });

  it("cancels with Esc and keeps the panel open", async () => {
    const { user, onRename } = setup();
    await user.click(screen.getByRole("button", { name: "Rename My own answer" }));
    await user.type(screen.getByLabelText("New title"), "x{Escape}");

    expect(onRename).not.toHaveBeenCalled();
    expect(screen.queryByLabelText("New title")).toBeNull();
    expect(screen.getByRole("heading", { name: "Library" })).toBeTruthy();
  });
});

describe("LibraryPanel: delete", () => {
  it("asks once before deleting", async () => {
    const { user, onDelete } = setup();
    await user.click(screen.getByRole("button", { name: "Delete My own answer" }));

    const dialog = screen.getByRole("alertdialog");
    expect(within(dialog).getByText(/“My own answer” and its practice history/)).toBeTruthy();

    await user.click(within(dialog).getByRole("button", { name: "Delete" }));

    expect(onDelete).toHaveBeenCalledWith("manual");
  });

  it("deletes nothing when cancelled", async () => {
    const { user, onDelete } = setup();
    await user.click(screen.getByRole("button", { name: "Delete My own answer" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onDelete).not.toHaveBeenCalled();
  });
});

describe("LibraryPanel: up next and practice days", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("offers the first answer of the daily order not practised yet", async () => {
    const { user, onLoad } = setup("manual");
    const upNext = screen.getByRole("region", { name: "Up next" });

    await user.click(within(upNext).getByRole("button", { name: "Start Day 1 · Task 2" }));

    expect(onLoad).toHaveBeenCalledWith("d1-t2");
  });

  it("leaves Up next out when that answer is already open", () => {
    setup("d1-t2");

    expect(screen.queryByRole("region", { name: "Up next" })).toBeNull();
  });

  it("says on how many of the last 7 days the learner practised", () => {
    // Only Date is faked, so user-event's timers still run.
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-23T12:00:00.000Z"));
    setup();

    expect(screen.getByText("Practised on 1 of the last 7 days")).toBeTruthy();
  });
});

describe("LibraryPanel: export", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("downloads the answers and attempts as a dated JSON file", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 10, 26, 12, 0));
    let blob: Blob | undefined;
    vi.spyOn(URL, "createObjectURL").mockImplementation((value) => {
      blob = value as Blob;
      return "blob:export";
    });
    const revokeObjectURL = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const { user } = setup();

    await user.click(screen.getByRole("button", { name: "Export" }));

    expect(click).toHaveBeenCalledOnce();
    const link = click.mock.contexts[0] as HTMLAnchorElement;
    expect(link.download).toBe("copylekha-2026-11-26.json");
    expect(link.href).toBe("blob:export");
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:export");
    expect(blob?.type).toBe("application/json");
    const exported: unknown = JSON.parse((await blob?.text()) ?? "");
    expect(exported).toMatchObject({ app: "copylekha", answers: ANSWERS, attempts: ATTEMPTS });
  });
});
