"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";
import {
  AlertTriangle,
  CalendarClock,
  Check,
  Loader2,
  Megaphone,
  RotateCcw,
  Send,
  X,
} from "lucide-react";
import {
  TEMPLATES,
  TEMPLATE_BY_ID,
  fillTemplate,
  type AnnouncementTemplate,
  type ClassContext,
} from "@/lib/announcement-templates";
import { sendAnnouncement, cancelScheduledAnnouncement } from "@/app/admin/actions";

/**
 * Write a message to the students.
 *
 * The commonest message anybody sends is "the class is cancelled today",
 * and writing it from scratch every time is how the room number gets left
 * out of a room change. So there are shapes for the usual things, and the
 * shape fills itself in from the timetable, which is the same timetable the
 * countdown reads, so a message cannot say the wrong time for a class.
 *
 * Everything the shape writes can be changed afterwards. The shape is a
 * starting point, not a rule, because sometimes the situation is not one of
 * the usual ones.
 *
 * Two things here are more than a form:
 *
 *   - **Urgent.** A class that is not running at nine in the morning is
 *     worth waking somebody up for, so an urgent message comes even in the
 *     middle of the night. It changes nothing else: a reader who turned a
 *     kind of notification off does not get that kind either, because being
 *     muted is their decision.
 *
 *   - **Ask them to confirm.** A cancellation is worth knowing people have
 *     seen, so a message can ask for a confirmation and the person who sent
 *     it can see how many said yes.
 */

export interface AnnouncementRow {
  id: string;
  title: string;
  body: string;
  kind: string;
  course: string | null;
  href: string | null;
  urgent: boolean;
  needs_ack: boolean;
  status: "sent" | "scheduled" | "cancelled";
  scheduled_for: string | null;
  created_at: string;
  created_by_name: string | null;
  sent_at: string | null;
  sent_count: number;
  skipped_count: number;
  gone_count: number;
  failed_count: number;
  acked: number;
}

function Submit({
  label,
  busyLabel,
  className,
}: {
  label: string;
  busyLabel: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={
        className ??
        "pressable inline-flex items-center gap-2 rounded-md bg-accent px-3.5 py-2 text-[12.5px] font-medium text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-50 max-sm:min-h-11 max-sm:px-4 max-sm:text-base"
      }
    >
      {pending ? (
        <Loader2 size={14} className="animate-spin" />
      ) : (
        <Send size={14} />
      )}
      {pending ? busyLabel : label}
    </button>
  );
}

function when(iso: string): string {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return "";
  return then.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Africa/Lagos",
  });
}

export default function AnnouncementComposer({
  contexts,
  history,
  courses,
}: {
  contexts: ClassContext[];
  history: AnnouncementRow[];
  courses: { code: string; title: string }[];
}) {
  const [template, setTemplate] = React.useState<AnnouncementTemplate>("cancelled");
  const [course, setCourse] = React.useState("");
  const [detail, setDetail] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [href, setHref] = React.useState("");
  const [urgent, setUrgent] = React.useState(true);
  const [needsAck, setNeedsAck] = React.useState(false);

  /**
   * The result of the last send.
   *
   * The action is the server's, so the message that comes back is the one
   * the server says, not one written in the browser.
   */
  const [result, send] = React.useActionState(sendAnnouncement, {});

  /** A note that is about this page rather than about the send. */
  const [note, setNote] = React.useState<string | null>(null);

  /**
   * The text the shape last wrote.
   *
   * The shape only writes over the text when the text is still the text it
   * wrote. A message somebody has taken the trouble to word themselves is
   * not overwritten because they changed the course.
   */
  const generated = React.useRef({ title: "", body: "", href: "" });

  const context = React.useMemo(
    () => contexts.find((c) => c.course === course) ?? null,
    [contexts, course]
  );

  const regenerate = React.useCallback(
    (which: AnnouncementTemplate, whichCourse: string, whichDetail: string) => {
      const t = TEMPLATE_BY_ID[which];
      const ctx = whichCourse
        ? contexts.find((c) => c.course === whichCourse) ?? null
        : null;
      const draft = fillTemplate(which, ctx, whichDetail);
      setTitle(draft.title);
      setBody(draft.body);
      setHref(draft.href);
      setUrgent(t.urgentByDefault);
      generated.current = { title: draft.title, body: draft.body, href: draft.href };
    },
    [contexts]
  );

  // The first shape, with nothing chosen yet.
  React.useEffect(() => {
    regenerate(template, course, detail);
    // Only on the first run. After that the reader is in charge of the text.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Whether the text is still the shape's, rather than the reader's. */
  const untouched =
    title === generated.current.title &&
    body === generated.current.body &&
    href === generated.current.href;

  function chooseTemplate(next: AnnouncementTemplate) {
    setTemplate(next);
    setNote(null);
    if (untouched) regenerate(next, course, detail);
    else {
      // The text stays, but the detail the shape needs may have changed.
      const t = TEMPLATE_BY_ID[next];
      setUrgent(t.urgentByDefault);
    }
  }

  function chooseCourse(next: string) {
    setCourse(next);
    setNote(null);
    if (untouched) regenerate(template, next, detail);
  }

  function chooseDetail(next: string) {
    setDetail(next);
    setNote(null);
    if (untouched) regenerate(template, course, next);
  }

  /** Take the text of an earlier message and send it again, changed. */
  function reuse(row: AnnouncementRow) {
    setTemplate("message");
    setCourse(row.course ?? "");
    setTitle(row.title);
    setBody(row.body);
    setHref(row.href ?? "");
    setUrgent(row.urgent);
    setNeedsAck(row.needs_ack);
    generated.current = { title: "", body: "", href: "" };
    setNote("Copied. Change it and send it again.");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /**
   * Stop a message that has not gone out yet.
   *
   * A push that has been sent cannot be taken back, but a message that is
   * still waiting can be stopped, and stopping it is better than sending a
   * second one saying there is not going to be a first one.
   */
  async function cancelIt(id: string) {
    setNote("Stopping it.");
    try {
      await cancelScheduledAnnouncement(id);
      setNote("It will not be sent.");
    } catch (error) {
      setNote(
        error instanceof Error ? error.message : "It could not be stopped."
      );
    }
  }

  const definition = TEMPLATE_BY_ID[template];
  const detailLabel =
    definition.detail === "room" ? "The new room" : "The new time";

  return (
    <div className="mt-10 space-y-10">
      {/* ---------------------------------------------- the composer */}
      <section>
        <h2 className="text-[15px] font-semibold tracking-tight text-foreground">
          Write a message
        </h2>
        <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-muted-foreground">
          It goes to everybody who has turned their notifications on, and to
          the bell on the site for anybody who is looking at it now.
        </p>

        <form
          action={send}
          className="mt-5 space-y-5"
        >
          {/* The shape. The buttons that pick it are not the form's submit
              button, so the shape has to be carried in the form itself. */}
          <input type="hidden" name="template" value={template} />

          {/* The shapes. */}
          <fieldset>
            <legend className="text-[12px] font-semibold uppercase tracking-[0.12em] text-muted">
              What is it about
            </legend>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => chooseTemplate(t.id)}
                  aria-pressed={template === t.id}
                  title={t.help}
                  className={
                    "pressable rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-colors max-sm:min-h-11 max-sm:px-3 " +
                    (template === t.id
                      ? "border-accent bg-accent/12 text-accent"
                      : "border-border text-muted-foreground hover:border-border-strong hover:text-foreground")
                  }
                >
                  {t.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[12px] text-muted">{definition.help}</p>
          </fieldset>

          {/* The course. */}
          {definition.needsCourse && (
            <div>
              <label
                htmlFor="announce-course"
                className="text-[12px] font-semibold uppercase tracking-[0.12em] text-muted"
              >
                Which course
              </label>
              <select
                id="announce-course"
                name="course"
                value={course}
                onChange={(e) => chooseCourse(e.target.value)}
                className="mt-2 block w-full max-w-sm rounded-md border border-border bg-surface px-3 py-2 text-[13px] text-foreground sm:w-auto max-sm:min-h-11 max-sm:text-base"
              >
                <option value="">Everybody</option>
                {courses.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} · {c.title}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-[12px] text-muted">
                {course
                  ? "Only the devices that asked about this course."
                  : "Every device that asked about every course."}
              </p>
            </div>
          )}

          {/* The extra detail. */}
          {definition.detail !== "none" && (
            <div>
              <label
                htmlFor="announce-detail"
                className="text-[12px] font-semibold uppercase tracking-[0.12em] text-muted"
              >
                {detailLabel}
              </label>
              <input
                id="announce-detail"
                name="detail"
                value={detail}
                onChange={(e) => chooseDetail(e.target.value)}
                placeholder={
                  definition.detail === "room" ? "Lab 2" : "11:00am"
                }
                className="mt-2 block w-full max-w-sm rounded-md border border-border bg-surface px-3 py-2 text-[13px] text-foreground max-sm:min-h-11 max-sm:text-base"
              />
            </div>
          )}

          {/* The text. */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="announce-title"
                className="text-[12px] font-semibold uppercase tracking-[0.12em] text-muted"
              >
                The title
              </label>
              <input
                id="announce-title"
                name="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
                required
                className="mt-2 w-full rounded-md border border-border bg-surface px-3 py-2 text-[13px] text-foreground max-sm:min-h-11 max-sm:text-base"
              />
            </div>
            <div>
              <label
                htmlFor="announce-href"
                className="text-[12px] font-semibold uppercase tracking-[0.12em] text-muted"
              >
                Where it goes when it is clicked
              </label>
              <input
                id="announce-href"
                name="href"
                value={href}
                onChange={(e) => setHref(e.target.value)}
                placeholder="/timetable"
                className="mt-2 w-full rounded-md border border-border bg-surface px-3 py-2 font-mono text-[12.5px] text-foreground max-sm:min-h-11 max-sm:text-base"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="announce-body"
              className="text-[12px] font-semibold uppercase tracking-[0.12em] text-muted"
            >
              The message
            </label>
            <textarea
              id="announce-body"
              name="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              maxLength={300}
              required
              className="mt-2 w-full rounded-md border border-border bg-surface px-3 py-2 text-[13px] leading-relaxed text-foreground max-sm:min-h-11 max-sm:text-base"
            />
            <p className="mt-1.5 text-[12px] text-muted">
              {body.length} of 300 characters. A notification shows about three
              lines.
            </p>
          </div>

          {/* When. */}
          <div>
            <label
              htmlFor="announce-when"
              className="text-[12px] font-semibold uppercase tracking-[0.12em] text-muted"
            >
              When
            </label>
            <input
              id="announce-when"
              name="when"
              type="datetime-local"
              className="mt-2 block rounded-md border border-border bg-surface px-3 py-2 text-[13px] text-foreground max-sm:min-h-11 max-sm:text-base"
            />
            <p className="mt-1.5 text-[12px] text-muted">
              Left empty, it goes out now. Otherwise it goes out within five
              minutes of the time, in Lagos time.
            </p>
          </div>

          {/* The switches. */}
          <div className="space-y-2.5">
            <label className="flex cursor-pointer items-start gap-2.5 max-sm:min-h-11">
              <input
                type="checkbox"
                name="urgent"
                checked={urgent}
                onChange={(e) => setUrgent(e.target.checked)}
                className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-[var(--accent)]"
              />
              <span>
                <span className="block text-[13px] font-medium text-foreground">
                  Come even in the quiet hours
                </span>
                <span className="block text-[12px] leading-relaxed text-muted">
                  For a class that is not running, a person asleep should still
                  find out. It changes nothing else: a reader who turned a
                  kind off does not get that kind either.
                </span>
              </span>
            </label>

            <label className="flex cursor-pointer items-start gap-2.5 max-sm:min-h-11">
              <input
                type="checkbox"
                name="needsAck"
                checked={needsAck}
                onChange={(e) => setNeedsAck(e.target.checked)}
                className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-[var(--accent)]"
              />
              <span>
                <span className="block text-[13px] font-medium text-foreground">
                  Ask them to say they have seen it
                </span>
                <span className="block text-[12px] leading-relaxed text-muted">
                  The reader gets a button in the bell, and you can see how
                  many said yes. It is a count of devices, not of people.
                </span>
              </span>
            </label>
          </div>

          {/* The preview. */}
          <div className="rounded-lg border border-border bg-surface-raised p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
              How it will look
            </p>
            <div className="mt-3 flex items-start gap-3">
              <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent/14 text-accent ring-1 ring-inset ring-accent/30">
                <Megaphone size={14} />
              </span>
              <div className="min-w-0">
                <p className="text-[13.5px] font-semibold leading-snug text-foreground">
                  {title || "The title"}
                </p>
                <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted-foreground">
                  {body || "The message."}
                </p>
                {href && (
                  <p className="mt-1 font-mono text-[11.5px] text-muted">
                    {href}
                  </p>
                )}
                {urgent && (
                  <p className="mt-1.5 inline-flex items-center gap-1 text-[11.5px] text-accent">
                    <AlertTriangle size={11} />
                    Comes even in the quiet hours
                  </p>
                )}
              </div>
            </div>
          </div>

          {result.error && (
            <p
              role="alert"
              className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-[12.5px] text-red-300"
            >
              {result.error}
            </p>
          )}

          {result.done && (
            <p
              role="status"
              className="rounded-md border border-accent/30 bg-accent/10 px-3 py-2 text-[12.5px] text-accent"
            >
              {result.done}
              {result.counts && result.counts.skipped > 0 && (
                <span className="text-muted-foreground">
                  {" "}
                  {result.counts.skipped} device
                  {result.counts.skipped === 1 ? "" : "s"} did not get it,
                  because they had turned that kind off or were in their quiet
                  hours.
                </span>
              )}
            </p>
          )}

          {note && (
            <p
              role="status"
              className="rounded-md border border-border bg-surface px-3 py-2 text-[12.5px] text-muted-foreground"
            >
              {note}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Submit label="Send it now" busyLabel="Sending" />
            {untouched && (
              <span className="text-[12px] text-muted">
                The shape wrote this. Change anything you like.
              </span>
            )}
          </div>
        </form>
      </section>

      {/* ---------------------------------------------- the history */}
      <section>
        <h2 className="text-[15px] font-semibold tracking-tight text-foreground">
          What has been said
        </h2>
        <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-muted-foreground">
          Every message, when it went out, and how far it got. A push cannot
          be taken back once it has been delivered, so a mistake is answered
          with another message rather than with a retraction.
        </p>

        {history.length === 0 ? (
          <p className="mt-5 text-[13px] text-muted-foreground">
            Nothing has been sent yet.
          </p>
        ) : (
          <ul className="mt-5 space-y-2.5">
            {history.map((a) => (
              <li
                key={a.id}
                className="rounded-lg border border-border bg-surface p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[13.5px] font-medium leading-snug text-foreground">
                      {a.title}
                    </p>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
                      {a.body}
                    </p>
                    <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] text-muted">
                      {a.status === "scheduled" ? (
                        <>
                          <CalendarClock size={11} />
                          Goes out {when(a.scheduled_for ?? a.created_at)}
                        </>
                      ) : (
                        <>
                          {when(a.sent_at ?? a.created_at)}
                          {a.created_by_name ? ` · ${a.created_by_name}` : null}
                        </>
                      )}
                      {a.course ? ` · ${a.course}` : " · everybody"}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {a.urgent && (
                      <span className="rounded-full bg-accent/12 px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-accent">
                        Urgent
                      </span>
                    )}
                    {a.status === "scheduled" && (
                      <>
                        <span className="rounded-full border border-border px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                          Waiting
                        </span>
                        <button
                          type="button"
                          onClick={() => void cancelIt(a.id)}
                          className="pressable inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-[11.5px] text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground max-sm:min-h-11 max-sm:px-3"
                        >
                          <X size={11} />
                          Stop it
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => reuse(a)}
                      className="pressable inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-[11.5px] text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground max-sm:min-h-11 max-sm:px-3"
                    >
                      <RotateCcw size={11} />
                      Send again
                    </button>
                  </div>
                </div>

                {a.status === "sent" && (
                  <p className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border pt-2.5 text-[11.5px] text-muted">
                    <span className="inline-flex items-center gap-1 text-accent">
                      <Check size={11} />
                      {a.sent_count} device{a.sent_count === 1 ? "" : "s"}
                    </span>
                    {a.skipped_count > 0 && (
                      <span>{a.skipped_count} did not get it</span>
                    )}
                    {a.failed_count > 0 && (
                      <span className="text-red-300">
                        {a.failed_count} refused by the push service
                      </span>
                    )}
                    {a.gone_count > 0 && (
                      <span>{a.gone_count} subscription had gone</span>
                    )}
                    {a.needs_ack && (
                      <span>
                        {a.acked} said they had seen it
                      </span>
                    )}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
