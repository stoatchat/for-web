import { Collapse, Deferred, List } from "@revolt/ui";
import {
  type ListView2Update,
  ListView2,
} from "@revolt/ui/components/utils/ListView2";
import { batch, createSignal, For, onMount } from "solid-js";
import { API, Server } from "stoat.js";
import { EntryRenderer } from "./LogEntryRenderer";

type Props = {
  server: Server;
};

const FETCH_LIMIT = 50;
const DISPLAY_LIMIT = 150;
const INITIAL_FETCH_LIMIT = 30;

export function ListAuditLogs(props: Props) {
  const [logs, setLogs] = createSignal<API.AuditLogEntry[]>([]);
  const [fetching, setFetching] = createSignal<
    "initial" | "upwards" | "downwards"
  >();
  const [failure, setFailure] = createSignal(false);
  const [atStart, setStart] = createSignal(true);
  const [atEnd, setEnd] = createSignal(false);
  const [listRef, setListRef] = createSignal<HTMLDivElement>();

  let preemptFetch: () => void | undefined;

  function canFetch() {
    return !fetching() || failure();
  }

  function findScrollContainer(el: Element | null | undefined): Element | null {
    if (!el) return null;
    if (["scroll", "auto"].includes(getComputedStyle(el).overflowY)) return el;
    return findScrollContainer(el.parentElement);
  }

  function preempt() {
    batch(() => {
      setFetching();
      setFailure(false);
      preemptFetch?.();
    });
  }

  function newPreempted() {
    let preempted = false;
    preemptFetch = () => {
      preempted = true;
    };

    return () => preempted;
  }

  async function caseInitialLoad() {
    preempt();
    setFetching("initial");
    const preempted = newPreempted();

    setLogs([]);
    setStart(true);
    setEnd(false);

    try {
      const logs = await props.server
        .getAuditLogs({
          limit: INITIAL_FETCH_LIMIT,
        })
        .then(({ audit_logs }) => audit_logs);

      if (preempted()) return;
      if (logs.length < INITIAL_FETCH_LIMIT) {
        setEnd(true);
      }
      setLogs(logs);

      // ListView2 uses column-reverse, where scrollTop 0 is the bottom.
      // Start at the top of the audit history after the DOM has rendered.
      requestAnimationFrame(() => {
        const container = findScrollContainer(listRef()) as HTMLElement | null;
        if (container) container.scrollTop = -container.scrollHeight;
      });

      setFetching();
    } catch {
      setFailure(true);
      setFetching();
    }
  }

  async function caseFetchTop(): Promise<ListView2Update | undefined> {
    if (atStart() || !canFetch()) return;

    setFetching("upwards");
    const preempted = newPreempted();

    try {
      const result = await props.server.getAuditLogs({
        limit: FETCH_LIMIT,
        after: logs()[0]._id,
      });

      if (preempted()) return;

      if (result.audit_logs.length < FETCH_LIMIT - 1) {
        setStart(true);
      }

      if (result.audit_logs.length) {
        const tooManyBy = Math.max(
          0,
          result.audit_logs.length + logs().length - DISPLAY_LIMIT,
        );

        if (tooManyBy > 0) {
          setStart(false);
        }

        setFailure(false);

        return {
          scrollAnchorId: logs()[0]?._id,
          commitToDOM() {
            setLogs((prev) => result.audit_logs.concat(prev));

            if (tooManyBy) {
              setLogs((prev) => prev.slice(tooManyBy));
            }

            setFetching();
          },
        };
      } else {
        setFetching();
      }
    } catch {
      setFailure(true);
      setFetching();
    }
  }

  async function caseFetchBottom(): Promise<ListView2Update | undefined> {
    if (atEnd() || !canFetch()) return;

    setFetching("downwards");
    const preempted = newPreempted();

    try {
      const result = await props.server.getAuditLogs({
        limit: FETCH_LIMIT,
        before: logs().slice(-1)[0]?._id,
      });

      if (preempted()) return;

      if (result.audit_logs.length < FETCH_LIMIT - 1) {
        setEnd(true);
      }

      if (result && result.audit_logs.length) {
        const tooManyBy = Math.max(
          0,
          result.audit_logs.length + logs().length - DISPLAY_LIMIT,
        );

        if (tooManyBy > 0) {
          setStart(false);
        }

        setFailure(false);

        return {
          scrollAnchorId: logs()[result.audit_logs.length - 1]?._id,
          commitToDOM() {
            setLogs((logs) => logs.concat(result.audit_logs));

            if (tooManyBy) {
              setLogs((prev) => prev.slice(0, -tooManyBy));
            }

            setFetching();
          },
        };
      } else {
        setFetching();
      }
    } catch {
      setFailure(true);
      setFetching();
    }
  }

  onMount(() => {
    caseInitialLoad();
  });

  return (
    <div style={{ height: "70vh", "max-height": "70vh" }}>
      <ListView2
        fetchTop={caseFetchTop}
        fetchBottom={caseFetchBottom}
        atStart={atStart}
        atEnd={atEnd}
        permitFetching={() => typeof fetching() !== "string"}
      >
        <Deferred>
          <div ref={setListRef}>
            <List>
              <Collapse accordion>
                <For each={logs()}>
                  {(entry) => (
                    <EntryRenderer server={props.server} entry={entry} />
                  )}
                </For>
              </Collapse>
            </List>
          </div>
        </Deferred>
      </ListView2>
    </div>
  );
}
