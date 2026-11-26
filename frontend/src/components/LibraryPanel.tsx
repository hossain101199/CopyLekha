"use client";

import { ArrowRight, Check, Download, Pencil, Trash2, X } from "lucide-react";
import { type FormEvent, memo, useCallback, useId, useMemo, useRef, useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { findUpNext, getLastAccuracies, getPracticeDays, groupAnswersByDay } from "@/lib/library";
import { createExport, getExportFileName } from "@/lib/storage";
import { tokenize } from "@/lib/tokenize";
import { type Answer, type Attempt, TASK_LABELS } from "@/lib/types";

// Every answer, grouped by day; load, rename or delete one. At the top,
// how often the learner practised lately and the answer up next. At the bottom,
// Export downloads the answers and attempts as a JSON file.

// One day is not a streak yet.
const MIN_STREAK_SHOWN = 2;

type LibraryPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  answers: Answer[];
  attempts: Attempt[];
  currentAnswerId: string | null;
  onLoad: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  // Called instead of the panel's own focus return, so focus can go to the typing box.
  onCloseAutoFocus: (event: Event) => void;
};

const describeAnswer = (answer: Answer, lastAccuracy: number | undefined): string => {
  const wordCount = tokenize(answer.text).length;
  const accuracy = lastAccuracy === undefined ? "Not practised yet" : `Last ${lastAccuracy}%`;
  return `${TASK_LABELS[answer.task]} · ${wordCount} words · ${accuracy}`;
};

// The file is made in the browser and saved like any download; nothing is sent anywhere.
const downloadExport = (answers: Answer[], attempts: Attempt[]): void => {
  const now = new Date();
  const json = JSON.stringify(createExport({ answers, attempts }, now), null, 2);
  const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = getExportFileName(now);
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

type RenameFormProps = {
  answer: Answer;
  onSave: (title: string) => void;
  onCancel: () => void;
};

const RenameForm = ({ answer, onSave, onCancel }: RenameFormProps) => {
  const [title, setTitle] = useState(answer.title);
  const inputId = useId();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // An empty title is not saved; the old one stays.
    const trimmed = title.trim();
    if (trimmed === "" || trimmed === answer.title) {
      onCancel();
      return;
    }
    onSave(trimmed);
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-1 px-2 py-1.5">
      <label htmlFor={inputId} className="sr-only">
        New title
      </label>
      <Input
        id={inputId}
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        autoFocus
        onFocus={(event) => event.currentTarget.select()}
      />
      <Button type="submit" variant="ghost" size="icon-lg" aria-label="Save title">
        <Check aria-hidden="true" />
      </Button>
      <Button type="button" variant="ghost" size="icon-lg" aria-label="Cancel" onClick={onCancel}>
        <X aria-hidden="true" />
      </Button>
    </form>
  );
};

type AnswerRowProps = {
  answer: Answer;
  description: string;
  isCurrent: boolean;
  onLoad: (id: string) => void;
  onStartRename: (id: string) => void;
  onAskDelete: (answer: Answer) => void;
};

const AnswerRow = memo(
  ({ answer, description, isCurrent, onLoad, onStartRename, onAskDelete }: AnswerRowProps) => (
    // The answer open now has a green bar and background and says so in words; any other
    // row only turns grey under the mouse.
    <div
      className="flex items-center gap-1 rounded-md border-l-4 border-transparent pr-1 hover:bg-muted data-[current=true]:border-primary data-[current=true]:bg-selected"
      data-current={isCurrent}
    >
      <button
        type="button"
        onClick={() => onLoad(answer.id)}
        aria-current={isCurrent ? "true" : undefined}
        className="flex min-w-0 flex-1 flex-col items-start gap-0.5 rounded-md px-2 py-1.5 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <span className="w-full truncate font-medium">{answer.title}</span>
        <span className="text-xs text-muted-foreground">
          {description}
          {isCurrent && <span className="font-semibold text-selected-foreground"> · Open now</span>}
        </span>
      </button>
      <Button
        variant="ghost"
        size="icon-lg"
        aria-label={`Rename ${answer.title}`}
        data-rename-for={answer.id}
        onClick={() => onStartRename(answer.id)}
      >
        <Pencil aria-hidden="true" />
      </Button>
      <Button
        variant="ghost"
        size="icon-lg"
        aria-label={`Delete ${answer.title}`}
        onClick={() => onAskDelete(answer)}
      >
        <Trash2 aria-hidden="true" />
      </Button>
    </div>
  ),
);
AnswerRow.displayName = "AnswerRow";

export const LibraryPanel = ({
  open,
  onOpenChange,
  answers,
  attempts,
  currentAnswerId,
  onLoad,
  onRename,
  onDelete,
  onCloseAutoFocus,
}: LibraryPanelProps) => {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  // Kept after the dialog closes, so its text doesn't change while it fades out.
  const [deleting, setDeleting] = useState<Answer | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const wasDeletedRef = useRef(false);

  const groups = useMemo(() => groupAnswersByDay(answers), [answers]);
  const lastAccuracies = useMemo(() => getLastAccuracies(attempts), [attempts]);
  const upNext = useMemo(() => findUpNext(answers, attempts), [answers, attempts]);
  // Counted when the attempts change; the panel is reopened often enough for "today".
  const practiceDays = useMemo(() => getPracticeDays(attempts, new Date()), [attempts]);

  // After a rename ends, focus goes back to that answer's Rename button.
  const finishRename = (id: string) => {
    setRenamingId(null);
    requestAnimationFrame(() => {
      contentRef.current?.querySelector<HTMLElement>(`[data-rename-for="${id}"]`)?.focus();
    });
  };

  const handleAskDelete = useCallback((answer: Answer) => {
    setDeleting(answer);
    setIsDeleteOpen(true);
  }, []);

  const handleConfirmDelete = () => {
    if (deleting !== null) {
      wasDeletedRef.current = true;
      onDelete(deleting.id);
    }
  };

  // The deleted answer's button is gone, so focus goes to the panel instead.
  const handleDeleteDialogCloseAutoFocus = (event: Event) => {
    if (wasDeletedRef.current) {
      wasDeletedRef.current = false;
      event.preventDefault();
      contentRef.current?.focus();
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setRenamingId(null);
    }
    onOpenChange(isOpen);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        ref={contentRef}
        className="data-[side=right]:w-full data-[side=right]:sm:max-w-none data-[side=right]:md:max-w-90"
        onCloseAutoFocus={onCloseAutoFocus}
        // Esc while renaming cancels the rename, not the whole panel.
        onEscapeKeyDown={(event) => {
          if (renamingId !== null) {
            event.preventDefault();
            finishRename(renamingId);
          }
        }}
      >
        <SheetHeader className="border-b">
          <SheetTitle className="text-lg">Library</SheetTitle>
          <SheetDescription>
            {answers.length === 1 ? "1 answer" : `${answers.length} answers`}
          </SheetDescription>
          {practiceDays.inLastWeek > 0 && (
            <p className="text-sm font-medium text-selected-foreground">
              Practised on {practiceDays.inLastWeek} of the last 7 days
              {practiceDays.streak >= MIN_STREAK_SHOWN && ` · ${practiceDays.streak} days in a row`}
            </p>
          )}
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-2 pb-4">
          {groups.length === 0 && (
            <p className="px-2 text-muted-foreground">No answers yet. Paste one to start.</p>
          )}
          {upNext !== null && upNext.id !== currentAnswerId && (
            <section aria-label="Up next" className="flex flex-col gap-1">
              <h3 className="px-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Up next
              </h3>
              <Button
                variant="outline"
                size="lg"
                className="mx-2 justify-start"
                onClick={() => onLoad(upNext.id)}
              >
                Start {upNext.title}
                <ArrowRight aria-hidden="true" />
              </Button>
            </section>
          )}
          {groups.map((group) => (
            <section key={group.label} aria-label={group.label} className="flex flex-col gap-1">
              <h3 className="px-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {group.label}
              </h3>
              <ul className="flex flex-col gap-0.5">
                {group.answers.map((answer) => (
                  <li key={answer.id}>
                    {renamingId === answer.id ? (
                      <RenameForm
                        answer={answer}
                        onSave={(title) => {
                          onRename(answer.id, title);
                          finishRename(answer.id);
                        }}
                        onCancel={() => finishRename(answer.id)}
                      />
                    ) : (
                      <AnswerRow
                        answer={answer}
                        description={describeAnswer(answer, lastAccuracies.get(answer.id))}
                        isCurrent={answer.id === currentAnswerId}
                        onLoad={onLoad}
                        onStartRename={setRenamingId}
                        onAskDelete={handleAskDelete}
                      />
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <SheetFooter className="border-t">
          <Button variant="outline" size="lg" onClick={() => downloadExport(answers, attempts)}>
            <Download aria-hidden="true" />
            Export
          </Button>
        </SheetFooter>

        {/* Deleting asks once. */}
        <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <AlertDialogContent onCloseAutoFocus={handleDeleteDialogCloseAutoFocus}>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this answer?</AlertDialogTitle>
              <AlertDialogDescription>
                &ldquo;{deleting?.title}&rdquo; and its practice history will be deleted. This
                can&apos;t be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              {/* Outline with the mistake colour: its text has 4.5:1 contrast in both themes. */}
              <AlertDialogAction
                variant="outline"
                className="text-error hover:text-error"
                onClick={handleConfirmDelete}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SheetContent>
    </Sheet>
  );
};
