import type { ComponentProps } from "solid-js";

import type { Badge } from "mdui/components/badge";
import type { Checkbox } from "mdui/components/checkbox";
import type { CircularProgress } from "mdui/components/circular-progress";
import type { List } from "mdui/components/list";
import type { ListItem } from "mdui/components/list-item";
import type { ListSubheader } from "mdui/components/list-subheader";
import type { MenuItem } from "mdui/components/menu-item";
import type { NavigationRail } from "mdui/components/navigation-rail";
import type { NavigationRailItem } from "mdui/components/navigation-rail-item";
import type { Radio } from "mdui/components/radio";
import type { RadioGroup } from "mdui/components/radio-group";
import type { SegmentedButton } from "mdui/components/segmented-button";
import type { SegmentedButtonGroup } from "mdui/components/segmented-button-group";
import type { Select } from "mdui/components/select";
import type { Slider } from "mdui/components/slider";
import type { Snackbar } from "mdui/components/snackbar";
import type { TextField } from "mdui/components/text-field";

declare module "solid-js" {
  namespace JSX {
    interface IntrinsicElements {
      "md-ripple": { disabled?: boolean };

      "mdui-checkbox": ComponentProps<Checkbox>;
      "mdui-circular-progress": ComponentProps<CircularProgress>;
      "mdui-segmented-button": ComponentProps<SegmentedButton>;
      "mdui-segmented-button-group": ComponentProps<SegmentedButtonGroup>;
      "mdui-menu-item": ComponentProps<MenuItem>;
      "mdui-badge": ComponentProps<Badge>;
      "mdui-navigation-rail": ComponentProps<NavigationRail>;
      "mdui-navigation-rail-item": ComponentProps<NavigationRailItem>;
      "mdui-select": ComponentProps<Select>;
      "mdui-list": ComponentProps<List>;
      "mdui-list-item": ComponentProps<ListItem>;
      "mdui-list-subheader": ComponentProps<ListSubheader>;
      "mdui-text-field": ComponentProps<TextField>;
      "mdui-slider": ComponentProps<Slider>;
      "mdui-radio": ComponentProps<Radio>;
      "mdui-radio-group": ComponentProps<RadioGroup>;
      "mdui-snackbar": ComponentProps<Snackbar>;
    }
  }
}
