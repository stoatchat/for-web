import { createSignal } from "solid-js";

import { Language } from "./Languages";

const [durationLocale, setDurationLocale] = createSignal<Language>(null!);

export function useDurationFormat() {
  return (
    duration: Partial<Record<Intl.DurationFormatUnit, number>>,
    options: Intl.DurationFormatOptions = { style: "long" },
    // eslint-disable-next-line solid/reactivity
  ) => new Intl.DurationFormat(durationLocale(), options).format(duration);
}

export function updateDurationLocale(key: Language) {
  setDurationLocale(key);
}
