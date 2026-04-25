import type { JSX } from "solid-js";

import "mdui/components/select.js";
import "mdui/components/text-field.js";

type Props = JSX.HTMLAttributes<HTMLInputElement> & {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value?: any;
  autoFocus?: boolean;
  required?: boolean;
  name?: string;
  label?: string;
  autosize?: boolean;
  disabled?: boolean;
  rows?: number;
  "min-rows"?: number;
  "max-rows"?: number;
  maxlength?: number;
  minlength?: number;
  counter?: boolean;
  placeholder?: string;
  type?:
    | "text"
    | "number"
    | "password"
    | "url"
    | "email"
    | "search"
    | "tel"
    | "hidden"
    | "date"
    | "datetime-local"
    | "month"
    | "time"
    | "week";
  variant?: "filled" | "outlined";
  enterkeyhint?:
    | "enter"
    | "done"
    | "go"
    | "next"
    | "previous"
    | "search"
    | "find";
  helper?: string;
  "helper-on-focus"?: boolean;
  clearable?: boolean;
  "clear-icon"?: string;
  "end-aligned"?: boolean;
  prefix?: string;
  suffix?: string;
  icon?: string;
  "end-icon"?: string;
  "error-icon"?: string;
  form?: string;
  readonly?: boolean;
  min?: number;
  max?: number;
  step?: number;
  pattern?: string;
  "toggle-password"?: boolean;
  "show-password-icon"?: string;
  "hide-password-icon"?: string;
  autocapitalize?: "none" | "sentences" | "words" | "characters";
  autocorrect?: string;
  autocomplete?: string;
  spellcheck?: boolean;
  inputmode?:
    | "none"
    | "text"
    | "decimal"
    | "numeric"
    | "tel"
    | "search"
    | "email"
    | "url";
  autofocus?: boolean;
  tabindex?: number;
};

/**
 * Text fields let users enter text into a UI
 *
 * @library MDUI
 * @specification https://m3.material.io/components/text-fields
 */
export function TextField(props: Props) {
  return (
    <mdui-text-field
      {...props}
      // @codegen directives props=props include=autoComplete
    />
  );
}

function Select(
  props: JSX.HTMLAttributes<HTMLInputElement> & {
    value?: string;
    variant?: "filled" | "outlined";
    required?: boolean;
    disabled?: boolean;
  },
) {
  return <mdui-select {...props} />;
}

/**
 * Select menu allows the user to pick a menu item
 *
 * Use the `MenuItem` component as the child:
 * ```tsx
 * <TextField.Select>
 *   <MenuItem value="itemA">hello!</MenuItem>
 *   <MenuItem value="itemB">world!</MenuItem>
 * </TextField.Select>
 * ```
 *
 * @library MDUI
 * @specification https://m3.material.io/components/menus
 */
TextField.Select = Select;
