import type { JSX } from "solid-js";
import { For, createSignal, createEffect } from "solid-js";
import { Text } from "@revolt/ui";

import { styled } from "styled-system/jsx"


type Props = {
  onChange?: (v: number) => void,
  includedays?: boolean
};

const TimePickerContainer = styled("div", {
  base: {
    display: "inline-flex",
    alignItems: "center"  
  }
})

const InputFieldContainer = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "var(--gap-xs)"
  }
})

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
    }
  }
})

const SeparatorContainer = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    alignSelf: "start",
    height: "96px",
    marginInline: "2px",
    fontSize: "57px",
    userSelect: "none"
  }
})

export function toOffset(
  seconds?: number = 0,
  minutes?: number = 0,
  hours?: number = 0,
  days?: number = 0
) {
  if ((seconds > 60 && seconds < 0) || (minutes > 60 && minutes < 0) || (hours > 24 && hours < 0)) {
    throw "Invalid time"
  }

  return (seconds + (minutes * 60) + (hours * (60 * 60)) + (days * (24 * 60 * 60))) * 1000
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

  createEffect(() => {
    if (props.onChange) {
      const offset = toOffset(
	Number(seconds()),
	Number(minutes()),
	Number(hours()),
	Number(days())
      )
      console.log("Current offset:", offset)
      props.onChange(offset)
    }
  })

  return (
    <TimePickerContainer>
      {props.includeDays &&
	<>	
	  <InputFieldContainer>
	    <InputField
	      type="number"
	      value={days()}
	      onChange={(e) => setDays(e.currentTarget.value)}
	      max={99} min={0}
	    ></InputField>
	    <Text>Days</Text>
	  </InputFieldContainer>
	  <SeparatorContainer>
	    <span role="presentation">&nbsp;</span>
	  </SeparatorContainer>
	</>
      }
      <InputFieldContainer>
	<InputField
	  type="number"
	  value={hours()}
	  onChange={(e) => setHours(e.currentTarget.value)}
	  max={24} min={0}
	></InputField>
	<Text>Hours</Text>
      </InputFieldContainer>
      <SeparatorContainer>
	<span role="presentation">:</span>
      </SeparatorContainer>
      <InputFieldContainer>
	<InputField
	  type="number"
	  value={minutes()}
	  onChange={(e) => setMinutes(e.currentTarget.value)}
	  max={60} min={0}
	></InputField>
	<Text>Minutes</Text>
      </InputFieldContainer>
      <SeparatorContainer>
	<span role="presentation">:</span>
      </SeparatorContainer>
      <InputFieldContainer>
	<InputField
	  type="number"
	  value={seconds()}
	  onChange={(e) => setSeconds(e.currentTarget.value)}
	  max={60} min={0}></InputField>
	<Text>Seconds</Text>
      </InputFieldContainer>
    </TimePickerContainer>
  )
}
