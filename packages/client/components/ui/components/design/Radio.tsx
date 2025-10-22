import { JSX } from "solid-js";

import "mdui/components/radio-group.js";
import "mdui/components/radio.js";

interface GroupProps {
  value?: string;
  onChange?: (event: { currentTarget: { value: string; } }) => void;
  required?: boolean;
  disabled?: boolean;
  children?: JSX.Element;
}

interface Props {
  value?: string;
  children?: JSX.Element;
}

/**
 * Radio buttons let people select one option from a set of options
 *
 * @library MDUI
 * @specification https://m3.material.io/components/radio
 */
export function Radio2(props: GroupProps) {
  return <mdui-radio-group {...props} />;
}

/**
 * Radio buttons let people select one option from a set of options
 *
 * @library MDUI
 * @specification https://m3.material.io/components/radio
 */
Radio2.Option = function Option(props: Props) {
  return <mdui-radio {...props} />;
};
