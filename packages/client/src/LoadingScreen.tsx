import { Trans, useLingui } from "@lingui-solid/solid/macro";
import { JSX, Show, createSignal, onCleanup, onMount } from "solid-js";
import { styled } from "styled-system/jsx";

import { Button, CircularProgress, Symbol, Text } from "@revolt/ui";

/**
 * Stoat status page URL
 */
const STATUS_PAGE_URL = "https://status.stoat.chat";

/**
 * Connection troubleshooting knowledge base article
 */
const TROUBLESHOOTING_URL =
  "https://support.stoat.chat/kb/troubleshooting/connection-issues";

/**
 * Status API queried when the client is slow to connect
 */
const STATUS_API_URL = "https://stoat.chat/-/status";

/**
 * How long to wait for a proper connection before asking the status API
 */
const STATUS_PROBE_DELAY = 5_000;

/**
 * How long to wait before showing troubleshooting advice if an incident has not been reported by the status API yet
 */
const TROUBLESHOOTING_DELAY = 10_000;

/**
 * Partial API response we care about
 */
type StatusResponse = {
  status?: {
    current_incident_impact?: string;
    active_incidents?: {
      title: string;
      status: string;
      incident_at: string;
    }[];
  };
};

/**
 * Whether the current origin is eligible to probe the status API
 */
const isEligibleOrigin = () => {
  const { hostname } = window.location;
  return (
    hostname === "localhost" || // (for testing)
    hostname.endsWith(".stoat.chat") ||
    hostname === "stoat.chat"
  );
};

/**
 * Loading screen shown while the client connects for the first time.
 *
 * If the connection does not succeed within {@link STATUS_PROBE_DELAY}, and we
 * are on an eligible origin, the status API is queried and any ongoing incident
 * is shown so the user knows the outage isn't on their end.
 *
 * Additionally if the connection does not succeed within {@link TROUBLESHOOTING_DELAY},
 * a troubleshooting notice is shown to help the user diagnose their connection issues.
 * We also link to the support page there.
 */
export function LoadingScreen() {
  const { t } = useLingui();

  const [notice, setNotice] = createSignal<
    | { type: "incident"; impact: string; title: string }
    | { type: "troubleshooting" }
  >();

  /**
   * Label for a status impact level
   */
  const impactLabel = (impact: string) => {
    switch (impact) {
      case "operational":
        return t`All Systems Operational`;
      case "degraded_performance":
        return t`Degraded Performance`;
      case "partial_outage":
        return t`Partial Outage`;
      case "major_outage":
        return t`Major Outage`;
      case "maintenance":
        return t`Ongoing Maintenance`;
      default:
        return t`Unknown`;
    }
  };

  onMount(() => {
    if (!isEligibleOrigin()) return;

    const controller = new AbortController();

    // Check the status API for an ongoing incident.
    const statusTimer = setTimeout(async () => {
      try {
        const res = await fetch(STATUS_API_URL, { signal: controller.signal });
        const data = (await res.json()) as StatusResponse;

        const impact = data?.status?.current_incident_impact;
        const active = (data.status?.active_incidents ?? []).filter(
          (i) => i.status !== "recovered",
        );

        if (impact && impact !== "operational" && active.length) {
          const newest = active.reduce((a, b) =>
            Date.parse(b.incident_at) > Date.parse(a.incident_at) ? b : a,
          );

          setNotice({ type: "incident", impact, title: newest.title });
        }
      } catch {
        // the troubleshooting timer handles this case
      }
    }, STATUS_PROBE_DELAY);

    // Still no incident so try troubleshooting
    const troubleshootingTimer = setTimeout(() => {
      setNotice((prev) => prev ?? { type: "troubleshooting" });
    }, TROUBLESHOOTING_DELAY);

    onCleanup(() => {
      clearTimeout(statusTimer);
      clearTimeout(troubleshootingTimer);
      controller.abort();
    });
  });

  return (
    <Base>
      <Spinner>
        <CircularProgress />
      </Spinner>

      <Show when={notice()} keyed>
        {(current) =>
          current.type === "incident" ? (
            <NoticeContent
              symbol={
                current.impact === "maintenance"
                  ? "build"
                  : "running_with_errors"
              }
              fill={current.impact === "maintenance"}
              label={impactLabel(current.impact)}
              title={current.title}
              url={STATUS_PAGE_URL}
              action={<Trans>View status page</Trans>}
            />
          ) : (
            <NoticeContent
              symbol="wifi_off"
              label={t`This is taking longer than usual.`}
              title={t`You may be experiencing connection issues.`}
              url={TROUBLESHOOTING_URL}
              action={<Trans>Troubleshooting</Trans>}
            />
          )
        }
      </Show>
    </Base>
  );
}

/**
 * A notice that can be shown below the loading spinner
 */
function NoticeContent(props: {
  symbol: string;
  fill?: boolean;
  label: JSX.Element;
  title: JSX.Element;
  url: string;
  action: JSX.Element;
}) {
  return (
    <Notice>
      <Header>
        <Impact>
          <Symbol fill={props.fill} size={28}>
            {props.symbol}
          </Symbol>
          <Text class="label" size="large">
            {props.label}
          </Text>
        </Impact>
        <Text class="title" size="medium">
          {props.title}
        </Text>
      </Header>
      <Button
        variant="text"
        onPress={() => window.open(props.url, "_blank", "noopener,noreferrer")}
      >
        {props.action}
      </Button>
    </Notice>
  );
}

/**
 * Full-height container that keeps the spinner centred
 */
const Base = styled("div", {
  base: {
    position: "relative",
    display: "flex",
    flexGrow: 1,
    minHeight: 0,
    alignItems: "center",
    justifyContent: "center",
  },
});

/**
 * Fixed size wrapper so the spinner does not stretch inside the flex column
 */
const Spinner = styled("div", {
  base: {
    flexShrink: 0,
    width: "48px",
    height: "48px",
  },
});

/**
 * Incident notice
 */
const Notice = styled("div", {
  base: {
    position: "absolute",
    top: "calc(50% + 48px)",
    insetInline: 0,

    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "var(--gap-lg)",
    textAlign: "center",
    maxWidth: "42ch",
    marginInline: "auto",
    paddingInline: "var(--gap-lg)",
    color: "var(--md-sys-color-on-surface-variant)",
  },
});

/**
 * Impact level and title
 */
const Header = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "var(--gap-md)",
  },
});

/**
 * Current incident impact level with symbol
 */
const Impact = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "var(--gap-md)",
    letterSpacing: "0.05em",
    color: "var(--md-sys-color-on-surface-variant)",
  },
});
