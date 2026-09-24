import { Collapse, Deferred, List } from "@revolt/ui";
import {
  type ListView2Update,
  ListView2,
} from "@revolt/ui/components/utils/ListView2";
import { batch, createEffect, createSignal, For, on } from "solid-js";
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
  const [atEnd, setEnd] = createSignal(true);

  let preemptFetch: () => void | undefined;

  function canFetch() {
    return !fetching || failure();
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
    try {
      const logs = await props.server
        .getAuditLogs({
          limit: INITIAL_FETCH_LIMIT,
        })
        .then(({ audit_logs }) => audit_logs);

      if (preempted()) return;

      setLogs(logs);
      setFetching();
    } catch {
      setFailure(true);
      setFetching();
    }
  }

  async function caseFetchUpwards(): Promise<ListView2Update | undefined> {
    if (atStart() || !canFetch()) return;

    setFetching("upwards");
    const preempted = newPreempted();
    try {
      const res = await props.server.getAuditLogs({
        limit: FETCH_LIMIT,
        before: logs().slice(-1)[0]._id,
      });

      if (preempted()) return;
      if (res.audit_logs.length < FETCH_LIMIT) {
        setStart(true);
      }

      if (res.audit_logs.length) {
        const tooManyBy = Math.max(
          0,
          res.audit_logs.length + logs().length - DISPLAY_LIMIT,
        );

        if (tooManyBy > 0) {
          setEnd(false);
        }

        const alogs = logs();
        return {
          scrollAnchorId: alogs[alogs.length - 1]._id,
          commitToDOM() {
            setLogs([...alogs, ...res.audit_logs]);

            if (tooManyBy) {
              setLogs((prev) => {
                return prev.slice(tooManyBy);
              });
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

  async function caseFetchDownwards(): Promise<ListView2Update | undefined> {
    if (atEnd() || !canFetch()) return;

    setFetching("downwards");
    const preempted = newPreempted();

    try {
      const result = await props.server.getAuditLogs({
        limit: FETCH_LIMIT,
        after: logs()[0]._id,
      });

      if (preempted()) return;

      if (result.audit_logs.length < FETCH_LIMIT) {
        setEnd(true);
      }

      if (result.audit_logs.length) {
        const tooManyBy = Math.max(
          0,
          result.audit_logs.length + logs().length - DISPLAY_LIMIT,
        );

        if (tooManyBy > 0) {
          setStart(false);
        }

        return {
          scrollAnchorId: logs()[0]._id,
          commitToDOM() {
            setLogs(() => {
              return [...result.audit_logs.reverse(), ...logs()];
            });

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

  createEffect(
    on(
      () => props.server,
      () => {
        caseInitialLoad();
      },
    ),
  );

  return (
    <ListView2
      fetchTop={caseFetchUpwards}
      fetchBottom={caseFetchDownwards}
      atStart={atStart}
      atEnd={atEnd}
      permitFetching={() => typeof fetching() !== "string"}
    >
      <List>
        <Collapse>
          <Deferred>
            <For each={logs()}>
              {(entry) => <EntryRenderer server={props.server} entry={entry} />}
            </For>
          </Deferred>
        </Collapse>
      </List>
    </ListView2>
  );
}
