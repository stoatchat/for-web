import { type JSX, createSignal, onCleanup, onMount } from "solid-js";

import { useTime } from "@revolt/i18n";
import { useState } from "@revolt/state";

interface Props {
  value: number | Date | string | JSX.Element;
  format:
    | "calendar"
    | "datetime"
    | "date"
    | "dateNormal"
    | "dateAmerican"
    | "iso8601"
    | "relative"
    | "time"
    | "time24"
    | "time12";
  referenceTime?: number | Date | string;
  hideSuffix?: boolean;
}

/**
 * Format a given date
 */
export function formatTime(
  dayjs: ReturnType<typeof useTime>,
  options: Props,
): JSX.Element | string | undefined | null {
  if (
    options.value instanceof Date ||
    typeof options.value === "number" ||
    typeof options.value === "string"
  ) {
    switch (options.format) {
      case "calendar":
        return dayjs(options.value).calendar(options.referenceTime);
      case "datetime":
        return `${formatTime(dayjs, {
          format: "date",
          value: options.value,
        })} ${formatTime(dayjs, { format: "time", value: options.value })}`;
      case "date":
      case "dateNormal":
        return dayjs(options.value).format("DD/MM/YYYY");
      case "dateAmerican":
        return dayjs(options.value).format("MM/DD/YYYY");
      case "iso8601":
        return dayjs(options.value).format("YYYY-MM-DD");
      case "relative":
        return dayjs(options.value).from(
          options.referenceTime ?? Date.now(),
          options.hideSuffix,
        );
      case "time12":
        return dayjs(options.value).format("h:mm A");
      case "time24":
        return dayjs(options.value).format("HH:mm");
      case "time":
        return dayjs(options.value).format("LT");
    }
  } else {
    return options.value;
  }
}

export function Time(props: Props) {
  const dayjs = useTime();
  const state = useState();
  const [time, setTime] = createSignal(formatTime(dayjs, props));

  const timer = () => setTime(formatTime(dayjs, props));

  onMount(() => state.perMinute(timer));
  onCleanup(() => state.clearPerMinute(timer));

  return (
    <time
      datetime={
        props.value instanceof Date ||
        typeof props.value === "number" ||
        typeof props.value === "string"
          ? new Date(props.value).toISOString()
          : undefined
      }
    >
      {time()}
    </time>
  );
}
