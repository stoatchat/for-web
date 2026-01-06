import {
  Accessor,
  For,
  JSX,
  Match,
  Show,
  Switch,
  batch,
  createEffect,
  createMemo,
  createSignal,
  on,
  onCleanup,
  onMount,
  splitProps,
} from "solid-js";

import isEqual from "lodash.isequal";
import { Channel, Message as MessageInterface } from "stoat.js";
import { styled } from "styled-system/jsx";

import { useClient, useClientLifecycle } from "@revolt/client";
import { State } from "@revolt/client/Controller";
import { useTime } from "@revolt/i18n";
import { useState } from "@revolt/state";
import {
  BlockedMessage,
  ConversationStart,
  Deferred,
  JumpToBottom,
  MessageDivider,
} from "@revolt/ui";

import {
  ListView2,
  ListView2Update,
} from "@revolt/ui/components/utils/ListView2";
import { Message } from "./Message";
import { useMessageCache } from "./MessageCache";

/**
 * Initial fetch limit
 */
const INITIAL_FETCH_LIMIT = 30;

/**
 * Fetch limit
 */
const FETCH_LIMIT = 50;

/**
 * Display limit
 */
const DISPLAY_LIMIT = 150;

interface Props {
  /**
   * Channel to fetch messages from
   */
  channel: Channel;

  /**
   * Pending messages to render at the end of the list
   */
  pendingMessages?: (props: { tail: boolean; ids: string[] }) => JSX.Element;

  /**
   * Display typing indicator instead of padding
   */
  typingIndicator?: JSX.Element;

  /**
   * Highlighted message id
   */
  highlightedMessageId: Accessor<string | undefined>;

  /**
   * Last read message id
   */
  lastReadId: Accessor<string | undefined>;

  /**
   * Clear the highlighted message
   */
  clearHighlightedMessage: () => void;

  /**
   * Bind the initial messages function to the parent component
   * @param fn Function
   */
  jumpToBottomRef?: (fn: (nearby?: string) => void) => void;

  /**
   * Bind the atEnd signal to the parent component
   * @param fn Function
   */
  atEndRef?: (fn: () => boolean) => void;
}

/**
 * Render messages in a Channel
 */
export function Messages(props: Props) {
  const cache = useMessageCache();
  const lifecycle = useClientLifecycle();
  const client = useClient();
  const state = useState();
  const dayjs = useTime();

  /**
   * Loaded messages
   */
  const [messages, setMessages] = createSignal<MessageInterface[]>([]);

  /**
   * Whether we've reached the start of the conversation
   */
  const [atStart, setStart] = createSignal(false);

  /**
   * Whether we've reached the end of the conversation
   */
  const [atEnd, setEnd] = createSignal(true);

  /**
   * The current direction of fetching
   */
  const [fetching, setFetching] = createSignal<
    "initial" | "upwards" | "downwards" | "jump_end" | "jump_msg"
  >();

  /**
   * Whether the current fetch has failed
   */
  const [failure, setFailure] = createSignal(false);

  /**
   * Collect messages during fetches
   *
   * The new message handler should write into this if it
   * is defined as opposed to appending to messages[] list
   */
  let collectedMessages: MessageInterface[] | undefined;

  /**
   * Pre-empt the current fetch
   */
  let preemptFetch: () => void | undefined;

  /**
   * Reference for the list container so we can scroll to elements
   */
  let listRef: HTMLDivElement | undefined;

  /**
   * Whether we can fetch
   * @returns Boolean
   */
  function canFetch() {
    return !fetching() || failure();
  }

  /**
   * Pre-empt the current fetch
   */
  function preempt() {
    batch(() => {
      setFetching();
      setFailure(false);
      preemptFetch?.();
    });
  }

  /**
   * Helper for checking if we've been pre-empted
   * @returns Function to check if we have been pre-empted
   */
  function newPreempted() {
    let preempted = false;
    preemptFetch = () => {
      preempted = true;
    };

    return () => preempted;
  }

  /**
   * Safely update messages by applying consistency checks
   * @param messagesArr Array of message arrays
   */
  function setMessagesSafely(...messagesArr: MessageInterface[][]) {
    setMessages(
      messagesArr.flat().toSorted((a, b) => b.id.localeCompare(a.id)),
    );
  }

  /**
   * Initial load subroutine
   * @param nearby Message we should load around (and then scroll to)
   */
  async function caseInitialLoad(nearby?: string) {
    // Pre-empt any fetches
    preempt();
    setFetching("initial");

    // Handle incoming pre-emptions
    const preempted = newPreempted();

    // Clear the messages list
    // NB. component does not remount on channel switch
    setMessages([]);

    // Set the initial position
    setStart(false);
    setEnd(true);

    // Start collecting messages
    collectedMessages = [];

    try {
      // Fetch messages for channel
      let messages;

      const existingState = cache!.unmanage(props.channel);
      const useExistingState = existingState && !nearby;

      if (useExistingState) {
        messages = existingState.messages;
      } else {
        messages = await props.channel
          .fetchMessagesWithUsers({
            limit: INITIAL_FETCH_LIMIT,
            nearby,
          })
          .then(({ messages }) => messages);
      }

      // Cancel if we've been pre-empted
      if (preempted()) return;

      // Assume we are not at the end if we jumped to a message
      // NB. we set this late to not display the "jump to bottom" bar
      if (typeof nearby === "string") {
        setEnd(
          // If the messages fetched include the latest message,
          // then we are at the end and mark the channel as such.
          messages.findIndex(
            (msg) => msg.id === props.channel.lastMessageId,
          ) !== -1,
        );
      }
      // Check if we're at the start of the conversation otherwise
      else if (!useExistingState && messages.length < INITIAL_FETCH_LIMIT) {
        setStart(true);
      }
      // Apply existing state if present
      else if (existingState) {
        setStart(existingState.atStart);
        setEnd(existingState.atEnd);
      }

      // Merge list with any new ones that have come in if we are at the end
      if (atEnd()) {
        const knownIds = new Set(collectedMessages!.map((x) => x.id));
        setMessagesSafely(
          collectedMessages!,
          messages.filter((x) => !knownIds.has(x.id)),
        );
      }
      // Otherwise just replace the whole list
      else {
        setMessages(messages);
      }

      // Stop collecting messages
      collectedMessages = [];

      // Mark as fetching has ended
      setFetching();

      // If we're not at the end, restore scroll position
      if (existingState && !existingState.atEnd) {
        setTimeout(() =>
          listRef!.scrollTo({
            top: existingState.scrollTop!,
            behavior: "instant",
          }),
        );
      }
      // Or... reset scroll to the end
      else if (atEnd()) {
        setTimeout(() =>
          listRef!.scrollTo({
            top: 9999999,
            behavior: "instant",
          }),
        );
      }
    } catch {
      // Keep track of any failures (and allow retry / other actions)
      setFailure(true);
      setFetching();
    }
  }

  /**
   * Fetch upwards from current position
   */
  async function caseFetchUpwards(): Promise<ListView2Update | undefined> {
    // Pre-conditions:
    // - Must not already be at the start
    // - Must not already be fetching (or otherwise the fetch must have failed)
    if (atStart() || !canFetch()) return;

    // Indicate we are fetching upwards
    setFetching("upwards");

    // Handle incoming pre-emptions
    const preempted = newPreempted();

    try {
      // Fetch messages for channel
      const result = await props.channel.fetchMessagesWithUsers({
        limit: FETCH_LIMIT,
        // Take the id of the oldest message currently fetched
        before: messages().slice(-1)[0].id,
      });

      // Cancel if we've been pre-empted
      if (preempted()) return;

      // If it's less than we expected, we are at the start
      if (result.messages.length < FETCH_LIMIT) {
        setStart(true);
      }

      // Prepend messages if we received any
      if (result.messages.length) {
        // Calculate how much we need to cut off the other end
        const tooManyBy = Math.max(
          0,
          result.messages.length + messages().length - DISPLAY_LIMIT,
        );

        // If it's at least one element, we are no longer at the end
        if (tooManyBy > 0) {
          setEnd(false);
        }

        const msgs = messages();
        return {
          scrollAnchorId: msgs[msgs.length - 1].id,
          commitToDOM() {
            setMessagesSafely(messages(), result.messages);

            if (tooManyBy) {
              setMessages((prev) => {
                return prev.slice(tooManyBy);
              });
            }

            setFetching();
          },
        };
      } else {
        setFetching();
      }
    } catch {
      // Keep track of any failures (and allow retry / other actions)
      setFailure(true);
      setFetching();
    }
  }

  /**
   * Fetch downwards from current position
   */
  async function caseFetchDownwards(): Promise<ListView2Update | undefined> {
    // Pre-conditions:
    // - Must not already be at the end
    // - Must not already be fetching (or otherwise the fetch must have failed)
    if (atEnd() || !canFetch()) return;

    // Indicate we are fetching downwards
    setFetching("downwards");

    // Handle incoming pre-emptions
    const preempted = newPreempted();

    try {
      // Fetch messages after the newest message we have
      const result = await props.channel.fetchMessagesWithUsers({
        limit: FETCH_LIMIT,
        after: messages()[0].id,
        sort: "Oldest",
      });

      // Cancel if we've been pre-empted
      if (preempted()) return;

      // If it's less than we expected, we are at the end
      if (result.messages.length < FETCH_LIMIT) {
        setEnd(true);
      }

      // If we received any messages at all, append them to the bottom
      if (result.messages.length) {
        // Calculate how much we need to cut off the other end
        const tooManyBy = Math.max(
          0,
          result.messages.length + messages().length - DISPLAY_LIMIT,
        );

        // If it's at least one element, we are no longer at the start
        if (tooManyBy > 0) {
          setStart(false);
        }

        return {
          scrollAnchorId: messages()[0].id,
          commitToDOM() {
            setMessages(() => {
              return [...result.messages.reverse(), ...messages()];
            });

            if (tooManyBy) {
              setMessages((prev) => prev.slice(0, -tooManyBy));
            }

            setFetching();
          },
        };
      } else {
        // Mark as fetching has ended
        setFetching();
      }
    } catch {
      // Keep track of any failures (and allow retry / other actions)
      setFailure(true);
      setFetching();
    }
  }

  /**
   * Jump to the present messages
   */
  async function caseJumpToBottom() {
    /**
     * Helper function to find the closest parent scroll container
     * @param el Element
     * @returns Element
     */
    function findScrollContainer(el: Element | null) {
      if (!el) {
        return null;
      } else if (getComputedStyle(el).overflowY === "scroll") {
        return el;
      } else {
        return el.parentElement;
      }
    }

    // Scroll to the bottom if we're already at the end
    if (atEnd()) {
      const containerChild = findScrollContainer(listRef!)!.children[0];
      containerChild!.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
    // Otherwise fetch present messages
    else {
      // Pre-empty any fetches
      preempt();
      setFetching("jump_end");

      // Handle incoming pre-emptions
      const preempted = newPreempted();

      // Start collecting messages
      collectedMessages = [];

      try {
        // Fetch messages for channel
        const { messages } = await props.channel.fetchMessagesWithUsers({
          limit: FETCH_LIMIT,
        });

        // Cancel if we've been pre-empted
        if (preempted()) return;

        // Check if we're at the start of the conversation
        // NB. this may be counter-intuitive because we are in history but,
        //     this could be a very rare edge case for large moderation actions
        if (messages.length < FETCH_LIMIT) {
          setStart(true);
        } else {
          setStart(false);
        }

        // Indicate we are at the end now
        setEnd(true);

        // Merge list with any new ones that have come in
        const knownIds = new Set(collectedMessages!.map((x) => x.id));
        setMessagesSafely(
          collectedMessages!,
          messages.filter((x) => !knownIds.has(x.id)),
        );

        // Stop collecting messages
        collectedMessages = [];

        // Animate scroll to bottom
        setTimeout(() => {
          const containerChild = findScrollContainer(listRef!)!.children[0];

          containerChild!.scrollIntoView({
            behavior: "instant",
            block: "start",
          });

          setTimeout(() => {
            containerChild!.scrollIntoView({
              behavior: "smooth",
              block: "end",
            });

            // Mark as fetching has ended
            setFetching();
          });
        });
      } catch {
        // Keep track of any failures (and allow retry / other actions)
        setFailure(true);
        setFetching();
      }
    }
  }

  /**
   * Jump to a given message
   * @param messageId Message Id
   */
  async function caseJumpToMessage(messageId: string) {
    /**
     * Scroll to the nearest message (to the id) in history
     */
    const scrollToNearestMessage = () => {
      const index = messagesWithTail().findIndex(
        (entry) => entry.t === 0 && entry.message.id === messageId,
      ); // use localeCompare

      listRef!.children[index + (atStart() ? 1 : 0)].scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    };

    if (messages().find((message) => message.id === messageId)) {
      scrollToNearestMessage();
      return;
    }

    // Pre-empty any fetches
    preempt();
    setFetching("jump_msg");

    // Handle incoming pre-emptions
    const preempted = newPreempted();

    try {
      // Fetch messages for channel
      const { messages } = await props.channel.fetchMessagesWithUsers({
        limit: FETCH_LIMIT,
        nearby: messageId,
      });

      // Cancel if we've been pre-empted
      if (preempted()) return;

      // Assume we are somewhere in history
      // NB. we could be clever here, but best not to be
      setStart(false);
      setEnd(false);

      // Replace the messages
      setMessagesSafely(messages);

      setTimeout(() => {
        // Scroll to the message
        scrollToNearestMessage();

        // Mark as fetching has ended
        setTimeout(() => {
          setFetching();
        }, 300 /* probably long enough for scroll to finish */);
      });
    } catch {
      // Keep track of any failures (and allow retry / other actions)
      setFailure(true);
      setFetching();
    }
  }

  // Setup references if they exists
  onMount(() => {
    props.jumpToBottomRef?.(jumpToBottom);
    props.atEndRef?.(atEnd);
  });

  /**
   * Fetch messages on channel mount
   */
  createEffect(
    on(
      () => props.channel,
      (channel) => {
        caseInitialLoad(props.highlightedMessageId());

        // move state into cache when navigating away
        onCleanup(() => {
          if (fetching() !== "initial") {
            cache!.manage(channel, {
              messages: messages(),
              atStart: atStart(),
              atEnd: atEnd(),
              scrollTop: listRef?.scrollTop,
            });
          }
        });
      },
    ),
  );

  /**
   * Jump to highlighted message
   */
  createEffect(
    on(
      () => props.highlightedMessageId(),
      (messageId) => {
        // Jump only if messages are loaded
        if (messageId && messages()) {
          caseJumpToMessage(messageId);
        }
      },
    ),
  );

  /**
   * Handle incoming messages
   * @param message Message object
   */
  function onMessage(message: MessageInterface) {
    if (message.channelId === props.channel.id && atEnd()) {
      setMessages([message, ...messages()]);
    }
  }

  /**
   * Handle deleted messages
   */
  function onMessageDelete(message: { id: string; channelId: string }) {
    if (
      message.channelId === props.channel.id &&
      messages().find((msg) => msg.id === message.id)
    ) {
      setMessages((messages) =>
        messages.filter((msg) => msg.id !== message.id),
      );
    }
  }

  // Add listener for messages
  onMount(() => {
    const c = client();
    c.addListener("messageCreate", onMessage);
    c.addListener("messageDelete", onMessageDelete);
  });

  onCleanup(() => {
    const c = client();
    c.removeListener("messageCreate", onMessage);
    c.removeListener("messageDelete", onMessageDelete);
  });

  // Ensure that we reload when lifecycle state changes
  createEffect(
    on(
      () => lifecycle.lifecycle.state(),
      (state) => {
        if (
          state === State.Connected &&
          atEnd() &&
          !props.highlightedMessageId
        ) {
          caseInitialLoad();
        }
      },
      { defer: true },
    ),
  );

  // We need to cache created objects to prevent needless re-rendering
  const objectCache = new Map();

  // Determine which messages have a tail and add message dividers
  const messagesWithTail = createMemo<ListEntry[]>(() => {
    const messagesWithTail: ListEntry[] = [];
    const lastReadId = props.lastReadId() ?? "0";

    let blockedMessages = 0;
    let insertedUnreadDivider = false;

    /**
     * Create blocked message divider
     */
    const createBlockedMessageCount = () => {
      if (blockedMessages) {
        messagesWithTail.push({
          t: 2,
          count: blockedMessages,
        });

        blockedMessages = 0;
      }
    };

    const arr = messages();
    arr.forEach((message, index) => {
      const next = arr[index + 1];
      let tail = true;

      // If there is a next message, compare it to the current message
      let date = null;
      if (next) {
        // Compare dates between messages
        const adate = message.createdAt,
          bdate = next.createdAt,
          atime = +adate,
          btime = +bdate;

        if (
          adate.getFullYear() !== bdate.getFullYear() ||
          adate.getMonth() !== bdate.getMonth() ||
          adate.getDate() !== bdate.getDate()
        ) {
          date = adate;
        }

        // Compare time and properties of messages
        if (
          // split up different authors
          message.authorId !== next.authorId ||
          // split up chains which are too far apart
          Math.abs(btime - atime) >= 420000 ||
          // treat masquerade as a change in author
          !isEqual(message.masquerade, next.masquerade) ||
          // ensure all system messages render independently
          message.systemMessage ||
          next.systemMessage ||
          // replies present on current message
          message.replyIds?.length ||
          // next message in history has already been read
          // so there will be a message divider present
          (next.id.localeCompare(lastReadId) === -1 && !insertedUnreadDivider)
        ) {
          tail = false;
        }
      } else {
        tail = false;
      }

      // Try to add the unread divider
      if (
        !insertedUnreadDivider &&
        message.id.localeCompare(lastReadId) === -1
      ) {
        insertedUnreadDivider = true;

        messagesWithTail.push(
          objectCache.get(true) ?? {
            t: 1,
            unread: true,
          },
        );
      }

      if (message.author?.relationship === "Blocked") {
        blockedMessages++;
      } else {
        // Push any blocked messages if they haven't been yet
        createBlockedMessageCount();

        // Add message to list, retrieve if it exists in the cache
        messagesWithTail.push(
          objectCache.get(`${message.id}:${tail}`) ?? {
            t: 0,
            message,
            tail,
          },
        );
      }

      // Add date to list, retrieve if it exists in the cache
      if (date) {
        messagesWithTail.push(
          objectCache.get(date) ?? {
            t: 1,
            date: dayjs(date).format("LL"),
          },
        );
      }
    });

    // Push remainder of blocked messages
    createBlockedMessageCount();

    // Strip unread divider if it is the first item
    // (hence would show alone at the bottom of messages)
    if (messagesWithTail[0]?.t === 1) {
      messagesWithTail.shift();
    }

    // Flush cache
    objectCache.clear();

    // Populate cache with current objects
    for (const object of messagesWithTail) {
      if (object.t === 0) {
        objectCache.set(`${object.message.id}:${object.tail}`, object);
      } else if (object.t === 1) {
        objectCache.set(object.unread ?? object.date, object);
      }
    }

    return messagesWithTail.reverse();
  });

  /**
   * Jump to the bottom of the chat
   */
  function jumpToBottom() {
    caseJumpToBottom();

    if (props.highlightedMessageId()) {
      props.clearHighlightedMessage();
    }
  }

  /**
   * Select last message for editing if signal is true
   */
  createEffect(
    on(
      () => state.draft.editingMessageId,
      (shouldSetEditingMessageId) =>
        shouldSetEditingMessageId === true &&
        state.draft.setEditingMessage(
          messages().find((message) => message.author?.self),
        ),
    ),
  );

  /**
   * Check whether to trail the currently pending messages
   * @returns Whether to trail pending message
   */
  function pendingMessageIsTrailing() {
    const messages = messagesWithTail();
    const lastMessage = messages[messages.length - 1];

    return lastMessage &&
      lastMessage.t === 0 &&
      // check if last message is authored by us
      lastMessage.message.author?.self &&
      // split up chains that are too far apart
      Math.abs(+new Date() - +lastMessage.message.createdAt) < 420000
      ? true
      : false;
  }

  /**
   * Message ids
   * @returns List of message ids
   */
  function sentMessageIdempotency() {
    return messages().map((msg) => msg.nonce!);
  }

  return (
    <>
      <ListView2
        fetchTop={caseFetchUpwards}
        fetchBottom={caseFetchDownwards}
        atStart={atStart}
        atEnd={atEnd}
        permitFetching={() => typeof fetching() !== "string"}
      >
        <Deferred>
          <div>
            <div ref={listRef}>
              <Show when={atStart()}>
                <ConversationStart channel={props.channel} />
              </Show>
              {/* TODO: else show (loading icon) OR (load more) */}
              <For each={messagesWithTail()}>
                {(entry) => (
                  <Entry
                    {...entry}
                    highlightedMessageId={props.highlightedMessageId}
                    editingMessageId={
                      typeof state.draft.editingMessageId === "string"
                        ? state.draft.editingMessageId
                        : undefined
                    }
                  />
                )}
              </For>
              {/* TODO: show (loading icon) OR (load more) */}
              <Show when={atEnd()}>
                {props.pendingMessages?.({
                  tail: pendingMessageIsTrailing(),
                  ids: sentMessageIdempotency(),
                })}
                {props.typingIndicator ?? <Padding />}
              </Show>
            </div>
          </div>
        </Deferred>
      </ListView2>
      <Show when={!atEnd()}>
        <AnchorToEnd>
          <JumpToBottom onClick={jumpToBottom} />
        </AnchorToEnd>
      </Show>
    </>
  );
}

/**
 * Anchor to the end of the messages list
 */
const AnchorToEnd = styled("div", {
  base: {
    zIndex: 30,
    position: "relative",

    "& > div": {
      width: "100%",
      position: "absolute",
      bottom: "var(--gap-md)",
    },
  },
});

/**
 * Container padding
 */
const Padding = styled("div", {
  base: {
    height: "24px",
  },
});

/**
 * List entries
 */
type ListEntry =
  | {
      // Message
      t: 0;
      message: MessageInterface;
      tail: boolean;
      highlight: boolean;
    }
  | {
      // Message Divider
      t: 1;
      date?: string;
      unread?: boolean;
    }
  | {
      // Blocked messages
      t: 2;
      count: number;
    };

/**
 * Render individual list entry
 */
function Entry(
  props: ListEntry &
    Pick<Props, "highlightedMessageId"> & { editingMessageId?: string },
) {
  const [local, other] = splitProps(props, [
    "t",
    "highlightedMessageId",
    "editingMessageId",
  ]);

  return (
    <Switch>
      <Match when={local.t === 0}>
        <Message
          {...(other as ListEntry & { t: 0 })}
          highlight={
            (other as ListEntry & { t: 0 }).message.id ===
            local.highlightedMessageId()
          }
          editing={
            (other as ListEntry & { t: 0 }).message.id ===
            local.editingMessageId
          }
        />
      </Match>
      <Match when={local.t === 1}>
        <MessageDivider {...(other as ListEntry & { t: 1 })} />
      </Match>
      <Match when={local.t === 2}>
        <BlockedMessage count={(other as ListEntry & { t: 2 }).count} />
      </Match>
    </Switch>
  );
}
