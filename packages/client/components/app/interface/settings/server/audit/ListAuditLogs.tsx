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

  /**
   * Helper function to find the closest parent scroll container
   * @param el Element
   * @returns Element
   */
  function findScrollContainer(el: Element | null | undefined) {
    if (!el) {
      return null;
    } else if (["scroll", "auto"].includes(getComputedStyle(el).overflowY)) {
      return el;
    } else {
      return findScrollContainer(el.parentElement);
    }
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
    console.log("[lv2] initial load");
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
      console.log(`[logs] got ${logs.length} logs`);

      if (preempted()) return;
      if (logs.length < INITIAL_FETCH_LIMIT) {
        console.log(`[lv2] is at end`);
        setEnd(true);
      }
      setLogs(logs);

      setTimeout(() => {
        findScrollContainer(listRef())?.scrollTo({
          top: -9999999,
          behavior: "instant",
        });
      });

      setFetching();
    } catch {
      setFailure(true);
      setFetching();
    }
  }

  async function caseFetchTop(): Promise<ListView2Update | undefined> {
    console.log(`[lv2] is at start? ${atStart()}\ncan fetch? ${canFetch()}`);
    if (atStart() || !canFetch()) return;

    setFetching("upwards");
    const preempted = newPreempted();

    console.log("[lv2] trying to fetch entries at the top");

    try {
      const result = await props.server.getAuditLogs({
        limit: FETCH_LIMIT,
        after: logs()[0]._id,
      });

      console.log(`[logs] got ${result.audit_logs.length} entries up`);

      if (preempted()) return;

      if (result.audit_logs.length < FETCH_LIMIT - 1) {
        console.log(`[lv2] is at start of list`);
        setStart(true);
      }

      if (result.audit_logs.length) {
        const tooManyBy = Math.max(
          0,
          result.audit_logs.length + logs().length - DISPLAY_LIMIT,
        );

        if (tooManyBy > 0) {
          console.log(`[lv2] is at middle of list, too many by ${tooManyBy}`);
          setStart(false);
        }

        return {
          scrollAnchorId: logs()[0]._id,
          commitToDOM() {
            setLogs(result.audit_logs);

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
    console.log(`[lv2] is at end? ${atEnd()}\ncan fetch? ${canFetch()}`);
    if (atEnd() || !canFetch()) return;

    setFetching("downwards");
    const preempted = newPreempted();

    console.log("[lv2] Fetching entries at the bottom");

    try {
      const result = await props.server.getAuditLogs({
        limit: FETCH_LIMIT,
        before: logs().splice(-1)[0]._id,
      });

      console.log(`[logs] got ${result.audit_logs.length} entries down`);

      if (preempted()) return;

      if (result.audit_logs.length < FETCH_LIMIT - 1) {
        console.log(`[lv2] is at bottom of list`);
        setEnd(true);
      }

      if (result && result.audit_logs.length) {
        const tooManyBy = Math.max(
          0,
          result.audit_logs.length + logs().length - DISPLAY_LIMIT,
        );

        if (tooManyBy > 0) {
          console.log(`[lv2] is at middle of list, too many by ${tooManyBy}`);
          setStart(false);
        }

        return {
          scrollAnchorId: result.audit_logs[result.audit_logs.length - 1]._id,
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
        </div>{" "}
      </Deferred>
    </ListView2>
  );
}
