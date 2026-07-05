import { Trans, useLingui } from "@lingui-solid/solid/macro";
import { Show, createSignal, onCleanup, onMount } from "solid-js";
import { styled } from "styled-system/jsx";

import { Button, CircularProgress, Symbol, Text } from "@revolt/ui";

/**
 * Stoat status page URL
 */
const STATUS_PAGE_URL = "https://status.stoat.chat";

/**
 * Status API queried when the client is slow to connect
 */
const STATUS_API_URL = "https://stoat.chat/-/status";

/**
 * How long to wait for a proper connection before asking the status API
 */
const STATUS_PROBE_DELAY = 5000;

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
 */
export function LoadingScreen() {
  const { t } = useLingui();

  const [incident, setIncident] = createSignal<{
    impact: string;
    title: string;
  }>();

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

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(STATUS_API_URL, { signal: controller.signal });
        const data = (await res.json()) as StatusResponse;

        const impact = data?.status?.current_incident_impact;
        if (!impact || impact === "operational") return;

        const active = (data.status?.active_incidents ?? []).filter(
          (i) => i.status !== "recovered",
        );
        if (!active.length) return;

        const newest = active.reduce((a, b) =>
          Date.parse(b.incident_at) > Date.parse(a.incident_at) ? b : a,
        );

        setIncident({ impact, title: newest.title });
      } catch {
        // Don't care
      }
    }, STATUS_PROBE_DELAY);

    onCleanup(() => {
      clearTimeout(timer);
      controller.abort();
    });
  });

  return (
    <Base>
      <Spinner>
        <CircularProgress />
      </Spinner>

      <Show when={incident()}>
        {(active) => (
          <Notice>
            <Header>
              <Impact>
                <Symbol fill={active().impact === "maintenance"} size={28}>
                  {active().impact === "maintenance"
                    ? "build"
                    : "running_with_errors"}
                </Symbol>
                <Text class="label" size="large">
                  {impactLabel(active().impact)}
                </Text>
              </Impact>
              <Text class="title" size="medium">
                {active().title}
              </Text>
            </Header>
            <Button
              variant="text"
              onPress={() =>
                window.open(STATUS_PAGE_URL, "_blank", "noopener,noreferrer")
              }
            >
              <Trans>View status page</Trans>
            </Button>
          </Notice>
        )}
      </Show>
    </Base>
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
