import { JSX, Match, Show, Switch } from "solid-js";

import { useLingui } from "@lingui-solid/solid/macro";
import { Message } from "stoat.js";
import { cva } from "styled-system/css";
import { styled } from "styled-system/jsx";

import { Ripple, typography } from "@revolt/ui/components/design";
import { Column, Row } from "@revolt/ui/components/layout";
import {
  NonBreakingText,
  OverflowingText,
  Time,
} from "@revolt/ui/components/utils";

import { MessageToolbar } from "./MessageToolbar";

interface CommonProps {
  /**
   * Whether this is the tail of another message
   */
  tail?: boolean;

  /**
   * Whether to move the username and related to the left
   *
   * If you want to hide it completely, add a <Match when={true} /> to infoMatch
   */
  compact?: boolean;

  /**
   * Whether this message should be treated as a link
   */
  isLink?: boolean | "hide";
}

type Props = CommonProps & {
  message?: Message;

  /**
   * Avatar URL
   */
  avatar: JSX.Element;

  /**
   * Username element
   */
  username: JSX.Element;

  /**
   * Message content
   */
  children: JSX.Element;

  /**
   * Message header
   */
  header?: JSX.Element;

  /**
   * Message info line
   */
  info?: JSX.Element;

  /**
   * Timestamp message was sent at
   */
  timestamp: Date | JSX.Element;

  /**
   * Date message was edited at
   */
  edited?: Date;

  /**
   * Whether this message mentions the user
   */
  mentioned?: boolean;

  /**
   * Whether this message should be highlighted
   */
  highlight?: boolean;

  /**
   * Whether this message is being edited
   */
  editing?: boolean;

  /**
   * Send status of this message
   */
  sendStatus?: "sending" | "failed";

  /**
   * Component to render message context menu
   */
  contextMenu?: () => JSX.Element;

  /**
   * Additional match cases for the inline-start information element
   */
  infoMatch?: JSX.Element;

  /**
   * Reference time to render timestamps from
   */
  _referenceTime?: number;
};

/**
 * Message container layout
 */
const base = cva({
  base: {
    position: "relative",

    display: "flex",
    flexDirection: "column",

    padding: "2px 0",
    background: "transparent",
    borderRadius: "var(--borderRadius-md)",
    minHeight: "1em",

    transition: "background-color var(--transitions-fast)",

    "& a:hover": {
      textDecoration: "underline",
    },

    "&:hover .Toolbar": {
      display: "flex",
    },
  },
  variants: {
    tail: {
      true: {
        marginTop: 0,
      },
    },
    mentioned: {
      true: {
        background: "var(--md-sys-color-primary-container)",
      },
    },
    highlight: {
      true: {
        animation: "highlightMessage 3s",
      },
    },
    sendStatus: {
      failed: {
        color: "var(--md-sys-color-error)",
      },
      sending: {
        color: "var(--md-sys-color-outline)",
      },
      sent: {
        color: "var(--md-sys-color-on-surface)",
      },
    },
    isLink: {
      true: {
        cursor: "pointer",
        userSelect: "none",
        position: "relative",

        "& *": {
          pointerEvents: "none",
        },
      },
      false: {
        marginTop: "var(--message-group-spacing) !important",

        "&:hover": {
          background: "var(--md-sys-color-surface-container)",
        },
      },
      hide: {},
    },
  },
  defaultVariants: {
    isLink: false,
    sendStatus: "sent",
  },
});

/**
 * Left-side information or avatar
 */
const Info = styled("div", {
  base: {
    display: "flex",
    flexShrink: 0,
    justifyContent: "end",
    padding: "2px var(--gap-sm)",
  },
  variants: {
    tail: {
      true: {
        padding: 0,
      },
    },
    compact: {
      true: {},
      false: {
        width: "52px",
      },
    },
  },
  defaultVariants: {
    compact: false,
  },
});

/**
 * Right-side message content
 */
const Body = styled("div", {
  base: {
    flexGrow: 1,
    display: "flex",
    flexDirection: "column",

    minWidth: 0,
    overflow: "hidden",
    maxHeight: "200vh",
    paddingInlineEnd: "var(--gap-lg)",
  },
  variants: {
    editing: {
      true: {
        flexGrow: 1,
      },
    },
  },
});

const Content = styled("div", {
  base: {
    minWidth: 0,
    display: "flex",
    gap: "var(--gap-sm)",
    flexDirection: "column",

    ...typography.raw({ class: "_messages" }),
  },
});

/**
 * Information text
 */
const infoText = cva({
  base: {
    display: "flex",
    alignItems: "center",
    gap: "var(--gap-sm)",

    color: "var(--md-sys-color-outline)",

    ...typography.raw({ class: "body", size: "small" }),
  },
  variants: {
    prefix: {
      true: {
        width: "calc(36px + 2 * var(--gap-sm))",
        fontSize: "0.7em",

        display: "block",
        textAlign: "right",
        marginTop: "0.15em",
      },
    },
    hidden: {
      true: {
        opacity: 0,
        transition: "var(--transitions-fast) opacity",

        _groupHover: {
          opacity: 1,
        },
      },
    },
  },
});

/**
 * Additional styles for compact mode
 */
const CompactInfo = styled(Row, {
  base: {
    flexShrink: 0,
    marginTop: "-2px",
    height: "fit-content",
    paddingInline: "var(--gap-lg) 0",
  },
});

/**
 * Component to show avatar, username, timestamp and content
 */
export function MessageContainer(props: Props) {
  const { t } = useLingui();

  return (
    <div
      class={
        "group " +
        base({
          tail: props.tail,
          mentioned: props.mentioned,
          highlight: props.highlight,
          sendStatus: props.sendStatus,
          isLink: props.isLink,
        })
      }
      use:floating={{ contextMenu: props.contextMenu }}
    >
      <Show
        when={props.message && props.isLink !== true && props.isLink !== "hide"}
      >
        <MessageToolbar message={props.message} />
      </Show>

      <Show when={props.isLink}>
        <Ripple />
      </Show>

      {props.header}
      <Row>
        <Info tail={props.tail} compact={props.compact}>
          <Switch fallback={props.avatar}>
            {props.infoMatch ?? <Match when={false} children={null} />}
            <Match when={props.compact}>
              <CompactInfo gap="sm" align>
                <div
                  class={infoText()}
                  use:floating={{
                    tooltip: {
                      placement: "top",
                      content: (
                        <>
                          {t`Sent`}{" "}
                          <Time
                            format="datetime"
                            value={props.timestamp}
                            referenceTime={props._referenceTime}
                          />
                        </>
                      ) as string, // ignore aria requirement
                    },
                  }}
                >
                  <Time
                    format="time"
                    value={props.timestamp}
                    referenceTime={props._referenceTime}
                  />
                </div>
                {props.username}
                {props.info}
              </CompactInfo>
            </Match>
            <Match when={props.tail}>
              <div
                class={infoText({ hidden: !props.edited, prefix: true })}
                use:floating={{
                  tooltip: {
                    placement: "top",
                    content: (
                      <Column>
                        <span>
                          {t`Sent`}{" "}
                          <Time
                            format="datetime"
                            value={props.timestamp}
                            referenceTime={props._referenceTime}
                          />
                        </span>
                        <Show when={props.edited}>
                          <span>
                            {t`Edited`}{" "}
                            <Time
                              format="datetime"
                              value={props.edited}
                              referenceTime={props._referenceTime}
                            />
                          </span>
                        </Show>
                      </Column>
                    ) as string, // ignore aria requirement
                  },
                }}
              >
                <Show when={props.edited}>(edited)</Show>
                <Show when={!props.edited}>
                  <Time
                    value={props.timestamp}
                    format="time"
                    referenceTime={props._referenceTime}
                  />
                </Show>
              </div>
            </Match>
          </Switch>
        </Info>
        <Body editing={props.editing}>
          <Show when={!props.tail && !props.compact}>
            <Row gap="sm" align>
              <OverflowingText>{props.username}</OverflowingText>
              <NonBreakingText>
                <div class={infoText()}>
                  {props.info}
                  <Switch fallback={props.timestamp as string}>
                    <Match when={props.timestamp instanceof Date}>
                      <span
                        use:floating={{
                          tooltip: {
                            placement: "top",
                            content: (
                              <>
                                {t`Sent`}{" "}
                                <Time
                                  format="datetime"
                                  value={props.timestamp}
                                  referenceTime={props._referenceTime}
                                />
                              </>
                            ) as string, // ignore aria requirement
                          },
                        }}
                      >
                        <Time
                          format="calendar"
                          value={props.timestamp}
                          referenceTime={props._referenceTime}
                        />
                      </span>
                    </Match>
                  </Switch>
                  <Show when={props.edited}>
                    <span
                      use:floating={{
                        tooltip: {
                          placement: "top",
                          content: (
                            <>
                              {t`Edited`}{" "}
                              <Time
                                format="datetime"
                                value={props.edited}
                                referenceTime={props._referenceTime}
                              />
                            </>
                          ) as string, // ignore aria requirement
                        },
                      }}
                    >
                      (edited)
                    </span>
                  </Show>
                </div>
              </NonBreakingText>
            </Row>
          </Show>
          <Content>{props.children}</Content>
        </Body>
      </Row>
    </div>
  );
}
