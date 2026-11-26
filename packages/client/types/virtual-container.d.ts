/**
 * This file contains types for the @minht11/solid-virtual-container package as
 * it does not properly export it's types and breaks the build.
 *
 * This file may have to change if the upstream changes but does not change its
 * types. This is unlikely however due to the package not having been updated
 * since 2022.
 */
declare module "@minht11/solid-virtual-container" {
  import { Context, JSX } from "solid-js";
  interface VirtualState {
    focusPosition: number;
    mainAxis: {
      totalItemCount: number;
      focusPosition: number;
      scrollValue: number;
    };
    crossAxis: {
      totalItemCount: number;
    };
  }

  declare function VirtualContainer<T>(
    props: VirtualContainerProps<T>,
  ): JSX.Element;

  declare type ScrollDirection = "vertical" | "horizontal";
  interface VirtualItemSizeStatic {
    width?: number;
    height?: number;
  }
  declare type VirtualItemSizeDynamic = (
    crossAxisContentSize: number,
    isHorizontal: boolean,
  ) => VirtualItemSizeStatic;
  declare type VirtualItemSize = VirtualItemSizeStatic | VirtualItemSizeDynamic;
  interface VirtualItemProps<T> {
    items: readonly T[];
    item: T;
    index: number;
    tabIndex: number;
    style: Record<string, string | number | undefined>;
  }
  interface CrossAxisCountOptions {
    target: Axis;
    container: Axis;
    itemSize: Axis;
  }
  interface VirtualContainerProps<T> {
    items: readonly T[];
    itemSize: VirtualItemSize;
    scrollTarget?: HTMLElement;
    direction?: ScrollDirection;
    overscan?: number;
    className?: string;
    role?: JSX.HTMLAttributes<HTMLDivElement>["role"];
    crossAxisCount?: (
      measurements: CrossAxisCountOptions,
      itemsCount: number,
    ) => number;
    children: (props: VirtualItemProps<T>) => JSX.Element;
  }

  interface ScrollTargetContextProps {
    scrollTarget?: HTMLElement;
  }
  declare const ScrollTargetContext: Context<ScrollTargetContextProps>;

  interface Axis {
    main: number;
    cross: number;
  }

  interface Measurements {
    isMeasured: boolean;
    mainAxisScrollValue: number;
    itemSize: Axis;
    target: Axis;
    container: {
      offsetMain: number;
      offsetCross: number;
      main: number;
      cross: number;
    };
  }
}
