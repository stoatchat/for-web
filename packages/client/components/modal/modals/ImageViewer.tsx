import {
  Match,
  Show,
  Switch,
  createEffect,
  createSignal,
  on,
  onCleanup,
} from "solid-js";
import { Portal } from "solid-js/web";
import { Motion, Presence } from "solid-motionone";

import Panzoom, { PanzoomObject } from "@panzoom/panzoom";
import { css } from "styled-system/css";
import { styled } from "styled-system/jsx";

import { RenderAnchor } from "@revolt/markdown/plugins/anchors";
import {
  Button,
  Column,
  Dialog,
  DialogProps,
  IconButton,
  Text,
} from "@revolt/ui";

import MdClose from "@material-design-icons/svg/outlined/close.svg?component-solid";
import MdDownload from "@material-design-icons/svg/outlined/download.svg?component-solid";
import MdOpenInNew from "@material-design-icons/svg/outlined/open_in_new.svg?component-solid";
import MdZoomIn from "@material-design-icons/svg/outlined/zoom_in.svg?component-solid";
import MdZoomOut from "@material-design-icons/svg/outlined/zoom_out.svg?component-solid";

import { Modals } from "../types";

export function ImageViewerModal(
  props: DialogProps & Modals & { type: "image_viewer" },
) {
  const [ref, setRef] = createSignal<HTMLElement>();

  let panzoom: PanzoomObject;

  createEffect(
    on(
      () => ref(),
      (ref) => {
        if (ref) {
          const zoom = Panzoom(ref, {
            minScale: 0.1,
            maxScale: 5,
          });

          panzoom = zoom;

          function onMouseWheel(event: WheelEvent) {
            zoom.zoom(zoom.getScale() - event.deltaY / 1000);
          }

          document.addEventListener("mousewheel", onMouseWheel as never);

          onCleanup(() => {
            document.removeEventListener("mousewheel", onMouseWheel as never);
            zoom.destroy();
          });
        }
      },
    ),
  );

  return (
    <Portal mount={document.getElementById("floating")!}>
      <Dialog.Scrim
        dark
        padding={false}
        overflow={false}
        show={props.show}
        onClick={props.onClose}
      >
        <Presence>
          <Show when={props?.show}>
            <Motion.div
              class={css({
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",

                minHeight: 0,
                width: "100%",
                height: "100%",

                paddingInline: "20px",
              })}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              transition={{
                duration: 0.3,
                easing: [0.17, 0.67, 0.58, 0.98],
              }}
            >
              <Relative>
                <Bar>
                  <Switch fallback={<div />}>
                    <Match when={props.file}>
                      <Card onClick={(e) => e.stopPropagation()}>
                        <Column>
                          <Text class="title">{props.file!.filename}</Text>
                          <Text class="label">
                            {props.file!.humanReadableSize}
                          </Text>
                        </Column>
                      </Card>
                    </Match>
                  </Switch>
                  <Card onClick={(e) => e.stopPropagation()}>
                    <IconButton onPress={() => panzoom?.zoomOut()}>
                      <MdZoomOut />
                    </IconButton>
                    <IconButton onPress={() => panzoom?.zoomIn()}>
                      <MdZoomIn />
                    </IconButton>
                    <Show when={props.file}>
                      <a
                        target="_blank"
                        href={props.file?.originalUrl}
                        download={props.file?.filename}
                      >
                        <IconButton>
                          <MdDownload />
                        </IconButton>
                      </a>
                    </Show>
                    <Show when={props.embed || props.gif}>
                      <RenderAnchor href={props.embed?.url || props.gif?.url}>
                        <IconButton>
                          <MdOpenInNew />
                        </IconButton>
                      </RenderAnchor>
                    </Show>
                    <IconButton onPress={props.onClose}>
                      <MdClose />
                    </IconButton>
                  </Card>
                </Bar>
              </Relative>
              <Switch>
                <Match when={props.file}>
                  <Image
                    ref={setRef}
                    style={{
                      "aspect-ratio": `${(props.file!.metadata as { width: number }).width}/${(props.file!.metadata as { height: number }).height}`,
                    }}
                    src={props.file!.originalUrl}
                    onClick={(e) => e.stopPropagation()}
                  />
                </Match>
                <Match when={props.embed}>
                  <Image
                    ref={setRef}
                    style={{
                      "aspect-ratio": `${props.embed!.width}/${props.embed!.height}`,
                    }}
                    src={props.embed!.proxiedURL}
                    onClick={(e) => e.stopPropagation()}
                  />
                </Match>
                <Match when={props.gif}>
                  <Video
                    ref={setRef}
                    loop
                    muted
                    autoplay
                    style={{
                      "aspect-ratio": `${props.gif!.width}/${props.gif!.height}`,
                    }}
                    src={props.gif!.proxiedURL}
                    onClick={(e) => e.stopPropagation()}
                  />
                </Match>
              </Switch>
              <div />
            </Motion.div>
          </Show>
        </Presence>
      </Dialog.Scrim>
    </Portal>
  );
}

const Image = styled("img", {
  base: {
    minHeight: 0,
    alignSelf: "center",
    objectFit: "contain",

    background: "rgba(0, 0, 0, 0.6)",
  },
});

const Video = styled("video", {
  base: {
    minHeight: 0,
    alignSelf: "center",
    objectFit: "contain",

    background: "rgba(0, 0, 0, 0.6)",
  },
});

const Relative = styled("div", {
  base: {
    position: "relative",
  },
});

const Bar = styled("div", {
  base: {
    width: "100%",
    position: "absolute",

    height: "120px",
    flexShrink: 0,

    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
});

const Card = styled("div", {
  base: {
    zIndex: 999,
    display: "flex",
    gap: "var(--gap-md)",
    padding: "var(--gap-md)",
    borderRadius: "var(--borderRadius-lg)",
    background: "var(--md-sys-color-surface)",
    color: "var(--md-sys-color-on-surface)",
  },
});
