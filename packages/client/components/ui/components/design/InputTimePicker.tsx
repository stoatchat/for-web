import type { JSX } from "solid-js";
import { For, createEffect, createSignal } from "solid-js";

import { Trans } from "@lingui-solid/solid/macro";
import { styled } from "styled-system/jsx";

import { Chip, Column, Row, Text } from "@revolt/ui";

type AssistChipProps = {
  label: string;
  value: number;
};

type Props = {
  value?: number;
  onChange?: (v: number) => void;
  includeDays?: boolean;
  assistChips?: AssistChipProps[];
};

const TimePickerContainer = styled("div", {
  base: {
    display: "inline-flex",
    alignItems: "center",
  },
});

const InputFieldContainer = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "var(--gap-xs)",
  },
});

const InputField = styled("input", {
  base: {
    display: "inline-flex",
    border: "3px solid transparent",
    appearance: "textfield",
    borderRadius: "8px",
    background: "var(--md-sys-color-surface-container-highest)",
    color: "var(--md-sys-color-on-surface)",
    lineHeight: "3.25rem",
    fontSize: "2.8125rem",
    textAlign: "center",
    width: "72px",
    height: "96px",
    transition: "background 100ms ease-in-out, border-color 100ms ease-in-out",
    "&:focus, &:focus-visible": {
      color: "var(--md-sys-color-on-primary-container)",
      backgroundColor: "var(--md-sys-color-primary-container)",
      outline: "none",
      borderColor: "var(--md-sys-color-on-primary-container)",
    },
  },
});

const SeparatorContainer = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    alignSelf: "start",
    height: "96px",
    marginInline: "2px",
    fontSize: "57px",
    userSelect: "none",
  },
});

export function toOffset(
  seconds: number = 0,
  minutes: number = 0,
  hours: number = 0,
  days: number = 0,
) {
  if (
    (seconds > 60 && seconds < 0) ||
    (minutes > 60 && minutes < 0) ||
    (hours > 24 && hours < 0)
  ) {
    throw "Invalid time";
  }

  return (
    (seconds + minutes * 60 + hours * (60 * 60) + days * (24 * 60 * 60)) * 1000
  );
}

type DecodedOffset = {
  days: number;
  minutes: number;
  hours: number;
  seconds: number;
};

function decodeOffset(offset: number): DecodedOffset {
  const MS_PER_SECOND = 1000;
  const MS_PER_MINUTE = MS_PER_SECOND * 60;
  const MS_PER_HOUR = MS_PER_MINUTE * 60;
  const MS_PER_DAY = MS_PER_HOUR * 24;

  let remaining = offset;

  const days = Math.floor(remaining / MS_PER_DAY);
  remaining %= MS_PER_DAY;

  const hours = Math.floor(remaining / MS_PER_HOUR);
  remaining %= MS_PER_HOUR;

  const minutes = Math.floor(remaining / MS_PER_MINUTE);
  remaining %= MS_PER_MINUTE;

  const seconds = Math.floor(remaining / MS_PER_SECOND);

  return {
    days,
    hours,
    minutes,
    seconds,
  };
}

/**
 * Time pickers let users set the time for time-dependant actions.
 * @specification https://m3.material.io/components/time-pickers
 */
export function InputTimePicker(props: Props) {
  const [days, setDays] = createSignal(0);
  const [hours, setHours] = createSignal(0);
  const [minutes, setMinutes] = createSignal(0);
  const [seconds, setSeconds] = createSignal(0);
  const [calculatedOffset, setCalculatedOffset] = createSignal(0);

  // [FIXME] this is genuinely ugly. there are probably better ways to handle this
  function setPreset(value: number) {
    const { days, hours, minutes, seconds } = decodeOffset(value);
    setDays(days);
    setHours(hours);
    setMinutes(minutes);
    setSeconds(seconds);
  }

  createEffect(() => {
    if (props.onChange) {
      const offset = toOffset(seconds(), minutes(), hours(), days());
      setCalculatedOffset(offset);
      console.log("Current offset:", offset);
      props.onChange(offset);
    }
  });

  return (
    <Column gap="md" align>
      {props.assistChips && (
        <Row>
          <For each={props.assistChips}>
            {(chip) => (
              <Chip
                variant="assist"
                selected={chip.value === calculatedOffset()}
                onClick={() => setPreset(chip.value)}
              >
                {chip.label}
              </Chip>
            )}
          </For>
        </Row>
      )}
      <TimePickerContainer>
        {props.includeDays && (
          <>
            <InputFieldContainer>
              <InputField
                type="number"
                value={days()}
                onChange={(e) => setDays(Number(e.currentTarget.value))}
                max={99}
                min={0}
              ></InputField>
              <Text>
                <Trans>Days</Trans>
              </Text>
            </InputFieldContainer>
            <SeparatorContainer>
              <span role="presentation">&nbsp;</span>
            </SeparatorContainer>
          </>
        )}
        <InputFieldContainer>
          <InputField
            type="number"
            value={hours()}
            onChange={(e) => setHours(Number(e.currentTarget.value))}
            max={24}
            min={0}
          ></InputField>
          <Text>
            <Trans>Hours</Trans>
          </Text>
        </InputFieldContainer>
        <SeparatorContainer>
          <span role="presentation">:</span>
        </SeparatorContainer>
        <InputFieldContainer>
          <InputField
            type="number"
            value={minutes()}
            onChange={(e) => setMinutes(Number(e.currentTarget.value))}
            max={60}
            min={0}
          ></InputField>
          <Text>
            <Trans>Minutes</Trans>
          </Text>
        </InputFieldContainer>
        <SeparatorContainer>
          <span role="presentation">:</span>
        </SeparatorContainer>
        <InputFieldContainer>
          <InputField
            type="number"
            value={seconds()}
            onChange={(e) => setSeconds(Number(e.currentTarget.value))}
            max={60}
            min={0}
          ></InputField>
          <Text>
            <Trans>Seconds</Trans>
          </Text>
        </InputFieldContainer>
      </TimePickerContainer>
    </Column>
  );
}
