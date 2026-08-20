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

import { useLingui } from "@lingui/solid/macro";
import Panzoom, { PanzoomObject } from "@panzoom/panzoom";
import { css } from "styled-system/css";
import { styled } from "styled-system/jsx";

import { MessageContextMenu } from "@revolt/app";
import {
  copyImageFromUrl,
  downloadFromUrl,
  filenameFromUrl,
} from "@revolt/common";
import { useModals } from "@revolt/modal";
import { Column, Dialog, DialogProps, IconButton, Text } from "@revolt/ui";
import { Symbol } from "@revolt/ui/components/utils/Symbol";

import { isGifBox } from "@revolt/common/lib/gifs";
import { Modals } from "../types";

export function ImageViewerModal(
  props: DialogProps & Modals & { type: "image_viewer" },
) {
  const { t } = useLingui();
  const { showError } = useModals();
  const [ref, setRef] = createSignal<HTMLElement>();

  function imageSrc() {
    if (props.file) {
      return props.file.originalUrl;
    }
    return props.embed?.proxiedURL ?? props.embed?.url;
  }

  function imageFilename() {
    return props.file?.filename ?? filenameFromUrl(imageSrc() ?? "", "image");
  }

  function saveImage() {
    const url = imageSrc();
    if (!url) return;
    downloadFromUrl(url, imageFilename()).catch(showError);
  }

  function copyImage() {
    const url = imageSrc();
    if (!url) return;
    copyImageFromUrl(url).catch(showError);
  }

  function copyImageUrl() {
    const url = imageSrc();
    if (!url) return;
    navigator.clipboard.writeText(url);
  }

  function imageContextMenu() {
    return <MessageContextMenu file={props.file} imageUrl={imageSrc()} />;
  }

  let panzoom: PanzoomObject;

  createEffect(
    on(
      () => ref(),
      (ref) => {
        if (ref) {
          ref.addEventListener("mousedown", (e) => {
            // prevent panzoom from panning when
            // context menu is triggered (or other
            // non-dragging buttons are used!)
            if (e.button !== 0) {
              e.preventDefault();
            }
          });

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
                    <IconButton
                      onPress={() => panzoom?.zoomOut()}
                      use:floating={{
                        tooltip: {
                          placement: "bottom",
                          content: t`Zoom out`,
                        },
                      }}
                    >
                      <Symbol>zoom_out</Symbol>
                    </IconButton>
                    <IconButton
                      onPress={() => panzoom?.zoomIn()}
                      use:floating={{
                        tooltip: {
                          placement: "bottom",
                          content: t`Zoom in`,
                        },
                      }}
                    >
                      <Symbol>zoom_in</Symbol>
                    </IconButton>
                    <Show when={imageSrc()}>
                      <IconButton
                        onPress={saveImage}
                        use:floating={{
                          tooltip: {
                            placement: "bottom",
                            content: t`Save image`,
                          },
                        }}
                      >
                        <Symbol>download</Symbol>
                      </IconButton>
                      <IconButton
                        onPress={copyImage}
                        use:floating={{
                          tooltip: {
                            placement: "bottom",
                            content: t`Copy image`,
                          },
                        }}
                      >
                        <Symbol>content_copy</Symbol>
                      </IconButton>
                      <IconButton
                        onPress={copyImageUrl}
                        use:floating={{
                          tooltip: {
                            placement: "bottom",
                            content: t`Copy image URL`,
                          },
                        }}
                      >
                        <Symbol>link</Symbol>
                      </IconButton>
                    </Show>
                    <Show when={props.embed || props.gif}>
                      <a
                        target="_blank"
                        rel="noreferrer"
                        href={props.embed?.url || props.gif?.url}
                      >
                        <IconButton>
                          <Symbol>open_in_new</Symbol>
                        </IconButton>
                      </a>
                    </Show>
                    <IconButton onPress={props.onClose}>
                      <Symbol>close</Symbol>
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
                    use:floating={{
                      contextMenu: imageContextMenu,
                    }}
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
                    use:floating={{
                      contextMenu: imageContextMenu,
                    }}
                  />
                </Match>
                <Match when={props.gif}>
                  <Video
                    ref={setRef}
                    playsinline
                    loop
                    muted
                    autoplay
                    style={{
                      "aspect-ratio": `${props.gif!.width}/${props.gif!.height}`,
                    }}
                    src={
                      isGifBox(props.gif!)
                        ? props.gif!.proxiedURL
                        : props.gif!.url
                    }
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
