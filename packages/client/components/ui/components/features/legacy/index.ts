import { CategoryButton, Checkbox, List, Switch } from "../../design";
import { Dialog, type DialogProps } from "../../design/Dialog";
import { TextField } from "../../design/TextField";
import { NavigationRail } from "../../navigation";

/**
 * @deprecated Use the `Dialog` export instead!
 */
export const Modal2 = Dialog;

/**
 * @deprecated Use the `DialogScrim` export instead!
 */
export const ModalScrim = Dialog.Scrim;

/**
 * @deprecated Use the `DialogProps` export instead!
 */
export type Modal2Props = DialogProps;

/**
 * @deprecated Use the `List.Item` export instead!
 */
export const ListItem = List.Item;

/**
 * @deprecated Use the `List.Subheader` export instead!
 */
export const ListSubheader = List.Subheader;

/**
 * @deprecated Use the `NavigationRail.Item` export instead!
 */
export const NavigationRailItem = NavigationRail.Item;

/**
 * @deprecated Use the `TextField.Select` export instead!
 */
export const Select = TextField.Select;

/**
 * @deprecated Use the `CategoryButton.Group` export instead!
 */
export const CategoryButtonGroup = CategoryButton.Group;

/**
 * @deprecated Use the `CategoryButton.Collapse` export instead!
 */
export const CategoryCollapse = CategoryButton.Collapse;

/**
 * @deprecated Use the `Switch.Override` export instead!
 */
export const OverrideSwitch = Switch.Override;

/**
 * @deprecated Use the `Checkbox` export instead!
 */
export const Checkbox2 = Checkbox;

export * from "./ComboBox";
export * from "./Form";
export * from "./Input";
export * from "./InputElement";
export * from "./LegacyCheckbox";
export * from "./Radio";
export * from "./SegmentedButton";
export * from "./Username";
