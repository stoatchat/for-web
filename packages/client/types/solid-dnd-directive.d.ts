/**
 * This file contains types for the solid-dnd-directive package as it does not
 * properly export it's types and breaks the build.
 *
 * This file may have to change if the upstream changes but does not change its
 * types. This is unlikely however due to the package not having been updated
 * since 2021.
 */

declare module "solid-dnd-directive" {
  declare function overrideItemIdKeyNameBeforeInitialisingDndZones(
    newId: string,
  ): void;
  declare type SolidOptions = {
    items: () => Array<
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Record<string, any>
    >; /**a getter the list of items (SIGNAL or a getter to STORE value) that was used to generate the children of the given node (the list used in the `<For>` block*/
    type?:
      | string
      | (() => string); /**the type of the dnd zone. children dragged from here can only be dropped in other zones of the same type, default to a base type*/
    flipDurationMs?:
      | number
      | (() => number); /**the duration of the flip animation. zero means no animation*/
    dragDisabled?: boolean | (() => boolean);
    morphDisabled?:
      | boolean
      | (() => boolean); /**whether dragged element should morph to zone dimensions*/
    dropFromOthersDisabled?: boolean | (() => boolean);
    zoneTabIndex?:
      | number
      | (() => number); /**set the tabindex of the list container when not dragging*/
    dropTargetStyle?: Record<string, string> | (() => Record<string, string>);
    dropTargetClasses?: string[] | (() => string[]);
  };
  declare function dndzone(
    node: HTMLElement,
    optionsGetter: () => SolidOptions,
  ): void;
}
