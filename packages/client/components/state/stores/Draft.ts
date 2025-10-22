import { Accessor, Setter, batch, createSignal } from "solid-js";

import { Node } from "prosemirror-model";
import { API, Channel, Client, Message } from "stoat.js";
import { ulid } from "ulid";

import { CONFIGURATION, insecureUniqueId } from "@revolt/common";

import { State } from "..";

import { AbstractStore } from ".";
import { LAYOUT_SECTIONS } from "./Layout";

export interface DraftData {
  /**
   * Message content
   */
  content?: string;

  /**
   * Message IDs being replied to
   */
  replies?: API.ReplyIntent[];

  /**
   * IDs of cached files
   */
  files?: string[];
}

export type UnsentMessage = {
  /**
   * Idempotency key
   */
  idempotencyKey: string;

  /**
   * Status
   */
  status: "sending" | "unsent" | "failed";
} & DraftData;

export interface TextSelection {
  /**
   * Draft we should update
   */
  channelId: string;

  /**
   * Start index of text selection
   */
  start: number;

  /**
   * End index of text selection
   */
  end: number;
}

export type TypeDraft = {
  /**
   * All active message drafts
   */
  drafts: Record<string, DraftData>;

  /**
   * Unsent messages
   */
  outbox: Record<string, UnsentMessage[]>;

  /**
   * Current message being edited
   * or used as a marker to load newest message as editor
   */
  editingMessageId?: string | true;

  /**
   * Value of message currently being edited
   */
  editingMessageContent?: string;
};

/**
 * List of image content types
 */
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

/**
 * Message drafts store
 */
export class Draft extends AbstractStore<"draft", TypeDraft> {
  /**
   * Keep track of cached files
   */
  private fileCache: Record<
    string,
    {
      file: File;
      dataUri?: string;
      dimensions?: [number, number];
      autumnId?: string;
      uploadProgress: [Accessor<number>, Setter<number>];
    }
  >;

  /**
   * Current text selection
   */
  private textSelection?: TextSelection;

  _setNodeReplacement?: Setter<Node | readonly ["_focus"] | undefined>;

  /**
   * Construct store
   * @param state State
   */
  constructor(state: State) {
    super(state, "draft");
    this.fileCache = {};

    this.getFile = this.getFile.bind(this);
    this.setEditingMessageContent = this.setEditingMessageContent.bind(this);
  }

  /**
   * Hydrate external context
   */
  hydrate(): void {
    /** nothing needs to be done */
  }

  /**
   * Generate default values
   */
  default(): TypeDraft {
    return {
      drafts: {},
      outbox: {},
    };
  }

  /**
   * Validate the given data to see if it is compliant and return a compliant object
   */
  clean(input: Partial<TypeDraft>): TypeDraft {
    const drafts: TypeDraft["drafts"] = {};
    const outbox: TypeDraft["outbox"] = {};

    /**
     * Validate replies array is correct
     * @param replies Replies array
     * @returns Validity
     */
    const validateReplies = (replies?: API.ReplyIntent[]) =>
      Array.isArray(replies) &&
      replies.length &&
      !replies.find(
        (x) =>
          typeof x !== "object" ||
          typeof x.id !== "string" ||
          typeof x.mention !== "boolean",
      );

    const messageDrafts = input.drafts;
    if (typeof messageDrafts === "object") {
      for (const channelId of Object.keys(messageDrafts)) {
        const entry = messageDrafts?.[channelId];
        const draft: DraftData = {};

        if (typeof entry?.content === "string" && entry.content) {
          draft.content = entry.content;
        }

        if (validateReplies(entry?.replies)) {
          draft.replies = entry!.replies;
        }

        if (Object.keys(draft).length) {
          drafts[channelId] = draft;
        }
      }
    }

    const pendingMessages = input.outbox;
    if (typeof pendingMessages === "object") {
      for (const channelId of Object.keys(pendingMessages)) {
        const entry = pendingMessages[channelId];
        const messages: UnsentMessage[] = [];

        if (Array.isArray(entry)) {
          for (const message of entry) {
            if (
              typeof message === "object" &&
              ["sending", "unsent", "failed"].includes(message.status) &&
              typeof message.idempotencyKey === "string" &&
              typeof message.content === "string" // shouldn't be enforced once we support caching files
            ) {
              const msg: UnsentMessage = {
                idempotencyKey: message.idempotencyKey,
                content: message.content,
                status: "unsent",
                // TODO: support storing unsent files in local storage
                // files: [..]
              };

              if (validateReplies(message.replies)) {
                msg.replies = message.replies;
              }

              messages.push(msg);
            }
          }
        }

        outbox[channelId] = messages;
      }
    }

    return {
      drafts,
      outbox,
    };
  }

  /**
   * Get draft for a channel.
   * @param channelId Channel ID
   */
  getDraft(channelId: string): DraftData {
    return this.get().drafts[channelId] ?? {};
  }

  /**
   * Check whether a channel has a draft.
   * @param channelId Channel ID
   */
  hasDraft(channelId: string) {
    const entry = this.get().drafts[channelId];
    return entry && entry.content!.length > 0;
  }

  /**
   * Set draft for a channel.
   * @param channelId Channel ID
   * @param data Draft content
   */
  setDraft(
    channelId: string,
    data?: DraftData | ((data: DraftData) => DraftData),
  ) {
    if (typeof data === "function") {
      data = data(this.getDraft(channelId));
    }

    if (typeof data === "undefined") {
      console.info("[draft] cleared!");
      return this.clearDraft(channelId);
    }

    console.info("[draft] updated to ", data);
    this.set("drafts", channelId, data);
  }

  /**
   * Clear draft from a channel.
   * @param channelId Channel ID
   */
  clearDraft(channelId: string) {
    const files = this.getDraft(channelId)?.files ?? [];
    for (const file of files) {
      delete this.fileCache[file];
    }

    this.setDraft(channelId, {
      content: "",
      replies: [],
      files: [],
    });
  }

  /**
   * Get the draft for a channel and send it
   * @param client Client
   * @param channel Channel
   * @param existingDraft The existing draft to send
   */
  async sendDraft(client: Client, channel: Channel, existingDraft?: DraftData) {
    const draft = existingDraft ?? this.popDraft(channel.id);

    // Check if this is something we can even send
    if (!draft.content && !draft.files?.length) return;

    // Add message to the outbox
    const idempotencyKey = ulid();
    this.set("outbox", channel.id, [
      ...this.getPendingMessages(channel.id),
      {
        ...draft,
        idempotencyKey,
        status: "sending",
      } as UnsentMessage,
    ]);

    // Try sending the message
    const { content, replies, files } = draft;

    // Construct message object
    const attachments: string[] = [];
    const data: API.DataMessageSend = {
      content,
      replies,
      attachments,
    };

    // Add any files if attached
    if (files?.length) {
      // TODO: keep track of % upload progress
      // we could visually show this in chat like
      // on Discord mobile and allow individual
      // files to be cancelled
      for (const fileId of files) {
        // Prepare for upload
        const body = new FormData();
        const { file, autumnId, uploadProgress } = this.getFile(fileId);

        // Use ID if already uploaded
        if (autumnId) {
          attachments.push(autumnId);
          continue;
        }

        body.set("file", file);

        // We have to use XMLHttpRequest because modern fetch duplex streams require QUIC or HTTP/2
        const xhr = new XMLHttpRequest();

        const [success, response] = await new Promise<
          [boolean, { id: string }]
        >((resolve) => {
          xhr.upload.addEventListener("progress", (event) => {
            if (event.lengthComputable) {
              uploadProgress[1](event.loaded / event.total);
            }
          });

          xhr.addEventListener("loadend", () => {
            uploadProgress[1](1);
            resolve([xhr.readyState === 4 && xhr.status === 200, xhr.response]);
          });

          xhr.open(
            "POST",
            `${client.configuration!.features.autumn.url}/attachments`,
            true,
          );

          const [authHeader, authHeaderValue] = client.authenticationHeader;
          xhr.setRequestHeader(authHeader, authHeaderValue);
          xhr.responseType = "json";

          xhr.send(body);
        });

        if (!success) throw "Upload Error";

        attachments.push(response.id);
        this.fileCache[fileId].autumnId = response.id;
      }
    }

    // TODO: fix bug with backend
    if (!attachments.length) {
      delete data.attachments;
    }

    // Send the message and clear the draft
    try {
      await channel.sendMessage(data, idempotencyKey);

      if (files) {
        for (const file of files) {
          this.removeFile(channel.id, file);
        }
      }

      this.set(
        "outbox",
        channel.id,
        this.getPendingMessages(channel.id).filter(
          (entry) => entry.idempotencyKey !== idempotencyKey,
        ),
      );
    } catch (err) {
      this.set(
        "outbox",
        channel.id,
        this.getPendingMessages(channel.id).map((entry) =>
          entry.idempotencyKey === idempotencyKey
            ? {
                ...entry,
                status: "failed",
              }
            : entry,
        ),
      );
    }
  }

  /**
   * Remove required objects for sending a new message
   * @param channelId Channel ID
   * @returns Object with all required data
   */
  popDraft(channelId: string) {
    const { content, replies, files } = this.getDraft(channelId);

    this.setDraft(channelId, {
      content: "",
      replies: [],
      files: files?.splice(CONFIGURATION.MAX_ATTACHMENTS),
    });

    return {
      content,
      replies,
      files: files?.slice(0, CONFIGURATION.MAX_ATTACHMENTS),
    };
  }

  /**
   * Retry sending a message in a channel
   * @param client Client
   * @param channel Channel
   * @param idempotencyKey Idempotency key
   */
  retrySend(client: Client, channel: Channel, idempotencyKey: string) {
    batch(() => {
      const draft = this.get().outbox[channel.id].find(
        (entry) => entry.idempotencyKey === idempotencyKey,
      );
      // TODO: validation?

      this.cancelSend(channel, idempotencyKey);
      this.sendDraft(client, channel, draft!);
    });
  }

  /**
   * Cancel sending a message in a channel
   * @param channel Channel
   * @param idempotencyKey Idempotency key
   */
  cancelSend(channel: Channel, idempotencyKey: string) {
    this.set(
      "outbox",
      channel.id,
      this.getPendingMessages(channel.id).filter(
        (entry) => entry.idempotencyKey !== idempotencyKey,
      ),
    );
  }

  /**
   * Get all pending messages
   * @param channelId Channel Id
   * @returns Pending messages
   */
  getPendingMessages(channelId: string) {
    return this.get().outbox[channelId] ?? [];
  }

  /**
   * Set the current text selection
   * @param channelId Channel Id
   * @param start Start index
   * @param end End index
   */
  setSelection(channelId: string, start: number, end: number) {
    this.textSelection = {
      channelId,
      start,
      end,
    };
  }

  /**
   * Insert text into the current selection
   * @param string Text
   */
  insertText(string: string) {
    if (this.textSelection) {
      const content = this.getDraft(this.textSelection.channelId).content ?? "";
      const startStr = content.slice(0, this.textSelection.start);
      const endStr = content.slice(this.textSelection.end, content.length);

      this.setDraft(this.textSelection.channelId, (draft) => ({
        ...draft,
        content: startStr + string + endStr,
      }));

      const pasteEndIdx = startStr.length + string.length;
      this.textSelection = {
        ...this.textSelection,
        start: pasteEndIdx,
        end: pasteEndIdx,
      };
    }
  }

  /**
   * Reset and clear all drafts.
   */
  reset() {
    this.set("drafts", {});
  }

  /**
   * Add a reply to the given message
   * @param message Message
   * @param selfId Own user ID
   */
  addReply(message: Message, selfId: string) {
    this._setNodeReplacement?.(["_focus"]);

    // Ignore if reply already exists
    if (
      this.getDraft(message.channelId).replies?.find(
        (reply) => reply.id === message.id,
      )
    )
      return;

    // We should not mention ourselves, otherwise use previous mention state
    const shouldMention =
      message.authorId !== selfId &&
      this.state.layout.getSectionState(LAYOUT_SECTIONS.MENTION_REPLY);

    // Update the draft with new reply
    this.setDraft(message.channelId, (data) => ({
      replies: [
        ...(data.replies ?? []),
        {
          id: message.id,
          mention: shouldMention,
        },
      ],
    }));
  }

  /**
   * Toggle reply mention
   *
   * This has a side-effect of updating the MENTION_REPLY section state!
   * @param channelId Channel ID
   * @param messageId Message ID
   */
  toggleReplyMention(channelId: string, messageId: string) {
    this.setDraft(channelId, (data) => ({
      replies: data.replies?.map((reply) => {
        if (reply.id === messageId) {
          // Save current mention reply state as new default
          this.state.layout.setSectionState(
            LAYOUT_SECTIONS.MENTION_REPLY,
            !reply.mention,
          );

          return { ...reply, mention: !reply.mention };
        }

        return reply;
      }),
    }));
  }

  /**
   * Remove a reply by message ID from a channel draft
   * @param channelId Channel ID
   * @param messageId Message ID
   */
  removeReply(channelId: string, messageId: string) {
    this.setDraft(channelId, (data) => ({
      replies: data.replies?.filter((reply) => reply.id !== messageId),
    }));
  }

  /**
   * Add a file to a draft
   * @param channelId Channel ID
   * @param file File to add
   */
  async addFile(channelId: string, file: File) {
    const id = insecureUniqueId();
    this.fileCache[id] = {
      file,
      dataUri: ALLOWED_IMAGE_TYPES.includes(file.type)
        ? URL.createObjectURL(file)
        : undefined,
      // we know what we're doing here...
      // eslint-disable-next-line solid/reactivity
      uploadProgress: createSignal(0),
    };

    if (this.fileCache[id].dataUri) {
      await new Promise((resolve, reject) => {
        const image = new Image();

        image.onload = () => {
          this.fileCache[id].dimensions = [image.width, image.height];
          resolve(void 0);
        };

        image.onerror = reject;
        image.src = this.fileCache[id].dataUri!;
      })
        // ignore errors
        .catch(() => {});
    }

    this.setDraft(channelId, (data) => ({
      files: [...(data.files ?? []), id],
    }));
  }

  /**
   * Delete a file from cache
   * @param fileId File ID
   */
  private deleteFile(fileId: string) {
    const file = this.fileCache[fileId];
    if (file?.dataUri) {
      URL.revokeObjectURL(file.dataUri);
    }

    delete this.fileCache[fileId];
  }

  /**
   * Remove a file from a draft
   * @param channelId Channel ID
   * @param fileId File ID
   */
  removeFile(channelId: string, fileId: string) {
    this.deleteFile(fileId);
    this.setDraft(channelId, (data) => ({
      files: data.files?.filter((entry) => entry !== fileId),
    }));
  }

  /**
   * Get cache File by its ID
   * @param fileId File ID
   * @returns Cached File
   */
  getFile(fileId: string) {
    return this.fileCache[fileId];
  }

  /**
   * Whether additional elements (attachment/reply) are present
   * @param channelId Channel ID
   * @returns Whether information is present
   */
  hasAdditionalElements(channelId: string): boolean {
    const draft = this.getDraft(channelId);
    return !!(draft.replies?.length || draft.files?.length);
  }

  /**
   * Remove additional information from a draft (file or reply)
   * @param channelId Channel ID
   * @returns Whether information was removed
   */
  popFromDraft(channelId: string): boolean {
    const draft = this.getDraft(channelId);

    if (draft.replies?.length) {
      this.setDraft(channelId, {
        replies: draft.replies.slice(0, draft.replies.length - 1),
      });

      return true;
    }

    if (draft.files?.length) {
      this.setDraft(channelId, {
        files: draft.files.slice(0, draft.files.length - 1),
      });

      return true;
    }

    return false;
  }

  /**
   * Set message ID
   * @param message Message ID
   */
  setEditingMessage(message: Message | true | undefined) {
    batch(() => {
      if (message instanceof Message)
        this.set("editingMessageContent", message.content);
      else this.set("editingMessageContent", undefined);

      this.set(
        "editingMessageId",
        message instanceof Message ? message.id : message,
      );
    });
  }

  /**
   * Set editing message content
   * @param content Content
   */
  setEditingMessageContent(content: string) {
    this.set("editingMessageContent", content);
  }

  /**
   * Message that is currently being edited
   */
  get editingMessageId() {
    return this.get().editingMessageId;
  }

  /**
   * Message edit content
   */
  get editingMessageContent() {
    return this.get().editingMessageContent;
  }
}
