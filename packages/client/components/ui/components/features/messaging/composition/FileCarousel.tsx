import { For, Match, Show, Switch } from "solid-js";

import { cva } from "styled-system/css";
import { styled } from "styled-system/jsx";

import { useInstance } from "@revolt/instance";
import { ALLOWED_IMAGE_TYPES } from "@revolt/state";
import { Ripple, typography } from "@revolt/ui/components/design";
import { iconSize, OverflowingText, Symbol } from "@revolt/ui/components/utils";

import MdAdd from "@material-design-icons/svg/outlined/add.svg?component-solid";
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

  /**
   * Whether a file is currently marked as a spoiler
   * @param fileId ID
   */
  isSpoiler(fileId: string): boolean;

  /**
   * Toggle spoiler state for a file
   * @param fileId ID
   */
  toggleSpoiler(fileId: string): void;
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
  const { limits } = useInstance();

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
               * Whether this file is marked as a spoiler
               */
              const spoiler = () => props.isSpoiler(id);

              /**
               * Handler for toggling spoiler state
               */
              const onToggleSpoiler = (event: MouseEvent) => {
                event.stopPropagation();
                props.toggleSpoiler(id);
              };

              /**
               * Handler for removing the file
               */
              const onClick = () => props.removeFile(id);

              return (
                <>
                  <Show when={index() === limits().message_attachments}>
                    <Divider />
                  </Show>

                  <Entry ignored={index() >= limits().message_attachments}>
                    <PreviewBox
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
                            spoiler={spoiler()}
                          />
                        </Match>
                      </Switch>

                      <Show when={spoiler()}>
                        <SpoilerLabel onClick={onToggleSpoiler}>
                          Spoiler
                        </SpoilerLabel>
                      </Show>

                      <ActionBox>
                        <ActionIcon onClick={onToggleSpoiler}>
                          <Switch
                            fallback={<Symbol size={16}>visibility</Symbol>}
                          >
                            <Match when={spoiler()}>
                              <Symbol size={16}>visibility_off</Symbol>
                            </Match>
                          </Switch>
                        </ActionIcon>
                        <ActionIcon danger onClick={onClick}>
                          <Symbol size={16}>delete</Symbol>
                        </ActionIcon>
                      </ActionBox>
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
    position: "relative",
    display: "grid",
    justifyItems: "center",
    gridTemplate: `"main" var(--preview-size) / minmax(var(--preview-size), 1fr)`,

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
    transition: "var(--transitions-fast) filter",
  },
  variants: {
    spoiler: {
      true: {
        filter: "blur(28px)",
      },
    },
  },
});

/**
 * Centered pill label shown over a spoiler-marked thumbnail; click to unmark
 */
const SpoilerLabel = styled("button", {
  base: {
    position: "absolute",
    top: "50%",
    left: "50%",
    zIndex: 2,
    transform: "translate(-50%, -50%)",

    padding: "4px var(--gap-sm)",
    borderRadius: "999px",
    border: "none",

    cursor: "pointer",
    color: "white",
    background: "rgba(0, 0, 0, 0.6)",

    textTransform: "uppercase",
    ...typography.raw({ class: "label", size: "small" }),
  },
});

/**
 * Grouped action toolbar, pinned to the top-right corner
 */
const ActionBox = styled("div", {
  base: {
    position: "absolute",
    top: "var(--gap-sm)",
    right: "var(--gap-sm)",
    zIndex: 3,

    display: "flex",
    alignItems: "center",
    gap: "2px",

    padding: "3px",
    borderRadius: "var(--borderRadius-md)",
    background: "rgba(0, 0, 0, 0.6)",
  },
});

/**
 * Individual icon button inside the action box
 */
const ActionIcon = styled("button", {
  base: {
    display: "grid",
    placeItems: "center",

    width: "22px",
    height: "22px",
    padding: 0,
    borderRadius: "var(--borderRadius-sm, 4px)",
    border: "none",

    cursor: "pointer",
    color: "white",
    background: "transparent",
    transition: "var(--transitions-fast) background",

    "&:hover": {
      background: "rgba(255, 255, 255, 0.15)",
    },
  },
  variants: {
    danger: {
      true: {
        color: "var(--md-sys-color-error)",
      },
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
