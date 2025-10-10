import { For, Match, Show, Switch } from "solid-js";

import { cva } from "styled-system/css";
import { styled } from "styled-system/jsx";

import { CONFIGURATION } from "@revolt/common";
import { ALLOWED_IMAGE_TYPES } from "@revolt/state/stores/Draft";
import { Ripple, typography } from "@revolt/ui/components/design";
import { OverflowingText, iconSize } from "@revolt/ui/components/utils";

import MdAdd from "@material-design-icons/svg/outlined/add.svg?component-solid";
import MdCancel from "@material-design-icons/svg/outlined/cancel.svg?component-solid";
import MdFile from "@material-design-icons/svg/outlined/description.svg?component-solid";

interface Props {
  /**
   * Files to display in carousel
   */
  files: string[];

  /**
   * Get file by ID
   * @param fileId ID
   */
  getFile(fileId: string): {
    file: File;
    dataUri?: string;
  };

  /**
   * Invoke file picker to add file
   */
  addFile(): void;

  /**
   * Remove file by ID
   * @param fileId ID
   */
  removeFile(fileId: string): void;
}

/**
 * Determine file size
 * @param size Bytes
 * @returns Human-readable size
 */
export function determineFileSize(size: number) {
  if (size > 1e6) {
    return `${(size / 1e6).toFixed(2)} MB`;
  } else if (size > 1e3) {
    return `${(size / 1e3).toFixed(2)} KB`;
  }

  return `${size} B`;
}

/**
 * File carousel
 */
export function FileCarousel(props: Props) {
  return (
    <Show when={props.files.length}>
      <Container>
        <div class={carousel()} use:scrollable={{ direction: "x" }}>
          <For each={props.files}>
            {(id, index) => {
              /**
               * Get the actual file
               */
              const file = () => props.getFile(id);

              /**
               * Handler for removing the file
               */
              const onClick = () => props.removeFile(id);

              return (
                <>
                  <Show when={index() === CONFIGURATION.MAX_ATTACHMENTS}>
                    <Divider />
                  </Show>

                  <Entry ignored={index() >= CONFIGURATION.MAX_ATTACHMENTS}>
                    <PreviewBox
                      onClick={onClick}
                      image={ALLOWED_IMAGE_TYPES.includes(file().file.type)}
                    >
                      <Switch
                        fallback={
                          <EmptyEntry>
                            <MdFile {...iconSize(36)} />
                          </EmptyEntry>
                        }
                      >
                        <Match
                          when={ALLOWED_IMAGE_TYPES.includes(file().file.type)}
                        >
                          <Image
                            src={file().dataUri}
                            alt={file().file.name}
                            loading="eager"
                          />
                        </Match>
                      </Switch>
                      <Overlay>
                        <MdCancel {...iconSize(36)} />
                      </Overlay>
                    </PreviewBox>
                    <FileName>
                      <OverflowingText>{file().file.name}</OverflowingText>
                    </FileName>
                    <Size>{determineFileSize(file().file.size)}</Size>
                  </Entry>
                </>
              );
            }}
          </For>
          <EmptyEntry onClick={props.addFile}>
            <Ripple />
            <MdAdd {...iconSize(48)} />
          </EmptyEntry>
        </div>
      </Container>
    </Show>
  );
}

/**
 * Image preview container
 */
const PreviewBox = styled("div", {
  base: {
    display: "grid",
    justifyItems: "center",
    gridTemplate: `"main" var(--preview-size) / minmax(var(--preview-size), 1fr)`,

    cursor: "pointer",
    overflow: "hidden",
    borderRadius: "var(--gap-md)",

    fill: "white",
    background: "var(--md-sys-color-surface-variant)",

    "& > *": {
      gridArea: "main",
    },
  },
  variants: {
    image: {
      true: {},
    },
  },
});

/**
 * Image preview
 */
const Image = styled("img", {
  base: {
    width: "100%",
    objectFit: "cover",
    marginBottom: "var(--gap-md)",
    height: "var(--preview-size)",
  },
});

/**
 * Overlay container
 */
const Overlay = styled("div", {
  base: {
    zIndex: 1,

    display: "grid",
    alignItems: "center",
    justifyContent: "center",

    width: "100%",
    height: "100%",

    opacity: 0,
    color: "white",
    background: "rgba(0, 0, 0, 0.8)",
    transition: "var(--transitions-fast) opacity",

    "&:hover": {
      opacity: 1,
    },
  },
});

/**
 * Empty entry container
 */
const EmptyEntry = styled("div", {
  base: {
    position: "relative",

    display: "grid",
    flexShrink: 0,
    placeItems: "center",
    width: "var(--preview-size)",
    height: "var(--preview-size)",

    cursor: "pointer",
    borderRadius: "var(--gap-md)",
    fill: "var(--md-sys-color-on-surface-variant)",
    background: "var(--md-sys-color-surface-variant)",
  },
});

/**
 * Carousel entry container
 */
const Entry = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    flexDirection: "column",
    opacity: 1,
  },
  variants: {
    ignored: {
      true: {
        opacity: 0.4,
      },
    },
  },
});

/**
 * File name information
 */
const FileName = styled("span", {
  base: {
    maxWidth: "var(--preview-size)",
    textAlign: "center",

    ...typography.raw({ class: "label" }),
  },
});

/**
 * File size information
 */
const Size = styled("span", {
  base: {
    ...typography.raw({ class: "label", size: "small" }),
  },
});

/**
 * Divider between files to be uploaded and files for next upload
 */
const Divider = styled("div", {
  base: {
    height: "130px",
    flexShrink: 0,
    width: "var(--gap-sm)",
    borderRadius: "var(--borderRadius-md)",
    background: "var(--md-sys-color-outline)",
  },
});

/**
 * Inner carousel container
 */
const carousel = cva({
  base: {
    display: "flex",
    flexShrink: 0,
    flexDirection: "row",
    overflowX: "auto !important",
    gap: "var(--gap-md)",
  },
});

/**
 * Outer carousel container
 */
const Container = styled("div", {
  base: {
    display: "flex",
    userSelect: "none",
    flexDirection: "column",

    gap: "var(--gap-md)",
    padding: "var(--gap-md)",
    margin: "var(--gap-md) 0",
    borderRadius: "var(--borderRadius-lg)",

    background: "var(--md-sys-color-primary-container)",
    color: "var(--md-sys-color-on-primary-container)",

    "--preview-size": "100px",
  },
});
