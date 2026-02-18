import { useLingui } from "@lingui-solid/solid/macro";
import { API } from "stoat.js";

/**
 * Translate any error
 */
export function useError() {
  const { t } = useLingui();

  return (error: unknown) => {
    // TODO: HTTP errors

    // handle Revolt API errors
    if (
      (error as { type?: never } | undefined)?.type &&
      typeof (error as { type: never }).type === "string"
    ) {
      const err = error as
        | API.Error
        | Exclude<
            API.Authifier_Error,
            | { type: "UnknownUser" }
            | { type: "DatabaseError" }
            | { type: "InternalError" }
          >;

      switch (err.type) {
        case "AlreadyFriends":
          return t`Already friends with this user.`;
        case "AlreadyInGroup":
          return t`You're already part of this group.`;
        case "AlreadyInServer":
          return t`You're already part of this server.`;
        case "AlreadyOnboarded":
          return t`Your user has already been created? Try logging in again or refreshing the app.`;
        case "AlreadyPinned":
          return t`This message is already pinned.`;
        case "AlreadySentRequest":
          return t`You've already sent a request to this user.`;
        case "Banned":
          return t`You are banned from this server.`;
        case "Blocked":
          return t`You have this user blocked.`;
        case "BlockedByOther":
          return t`This user has blocked you.`;
        case "BotIsPrivate":
          return t`This bot is private and can only be added by the creator.`;
        case "CannotEditMessage":
          return t`Cannot edit this message.`;
        case "CannotGiveMissingPermissions":
          return t`You cannot give yourself missing permissions.`;
        case "CannotJoinCall":
          return t`You cannot join this call.`;
        case "CannotRemoveYourself":
          return t`You cannot remove yourself.`;
        case "CannotReportYourself":
          return t`You cannot report yourself.`;
        case "CannotTimeoutYourself":
          return t`You cannot timeout yourself.`;
        case "DatabaseError":
          return t`Database error, please contact support. (${err.location})`;
        case "DiscriminatorChangeRatelimited":
          return t`Your discriminator change has been ratelimited, please try again later.`;
        case "DuplicateNonce":
          return t`This has already been sent.`;
        case "EmptyMessage":
          return t`This message is empty and has not been sent.`;
        case "FailedValidation":
          return t`Something is wrong with your request, ${err.error}.`;
        case "FeatureDisabled":
          return t`This feature is currently disabled.`;
        case "FileTypeNotAllowed":
          return t`This file type is not allowed.`;
        case "GroupTooLarge":
          return t`This group is too large, you can have up to ${err.max} users.`;
        case "ImageProcessingFailed":
          return t`Failed to process the image you provided.`;
        case "InternalError":
          return t`An internal error occurred. (${err.location})`;
        case "InvalidCredentials":
          return t`Provided email or password is wrong.`;
        case "InvalidSession":
          return t`Please log in again.`;
        case "InvalidUsername":
          return t`This username is not allowed.`;
        case "MissingPermission":
        case "MissingUserPermission":
          return t`You do not have permission to do this.`;
        case "NoEffect":
          return t`That action had no effect.`;
        case "NotElevated":
          return t`Your role ranking is too low to take this action.`;
        case "NotFound":
          return t`Could not find what you requested.`;
        case "ReachedMaximumBots":
          return t`You've reached your personal bot limit.`;
        case "UsernameTaken":
          return t`This username is already taken.`;
        case "TooManyEmoji":
          return t`You can't have more than ${err.max} emojis on this server.`;
        case "TooManyChannels":
          return t`You can't have more than ${err.max} channels on this server.`;
        case "TooManyServers":
          return t`You can't be in more than ${err.max} servers, please leave one and try again.`;
        case "TooManyPendingFriendRequests":
          return t`You've sent too many friend requests, the maximum is ${err.max}`;
        case "PayloadTooLarge":
          return t`Your message is too long, please remove some characters and try again.`;
        case "ShortPassword":
          return t`The password is too short.`;
        case "LockedOut":
          return t`You have been locked out for entering a wrong password multiple times. Please wait a couple minutes and try again.`;
        case "CompromisedPassword":
          return t`This password has previously appeared in security leaks, please use another password.`;
        case "UnverifiedAccount":
          return t`This account is not activated! Please check your account's inbox and try again.`;
        case "TotpAlreadyEnabled":
          return t`Multi-factor authentication is already enabled for this account.`;

        // unreachable errors (in theory)
        case "FileTooLarge":
        case "FileTooSmall":
        case "InvalidFlagValue":
        case "InvalidOperation":
        case "InvalidProperty":
        case "InvalidRole":
        case "IsBot":
        case "IsNotBot":
        case "LabelMe":
        case "NoEmbedData":
        case "NotAuthenticated":
        case "NotFriends":
        case "NotInGroup":
        case "NotOwner":
        case "NotPinned":
        case "NotPrivileged":
        case "ProxyError":
        case "TooManyAttachments": // todo: maybe handle these:
        case "TooManyEmbeds":
        case "TooManyReplies":
        case "TooManyRoles": // ... to here
        case "UnknownAttachment":
        case "UnknownChannel":
        case "UnknownMessage":
        case "UnknownServer":
        case "UnknownUser":
        case "VosoUnavailable":
          return err.type + " " + err.location;

        default:
          return t`Uncaught Stoat error: ${err.type}`;
      }
    }

    // pass-through pre-localised errors with new Error({ message: <> })
    if (
      (error as { message?: never } | undefined)?.message &&
      typeof (error as { message: never }).message === "string"
    ) {
      const message = (error as { message: string }).message.trim();
      if (message) return message;
    }

    return t`Something went wrong! ${error}`;
    // revert to `Try again later.` later
    // need to capture envelopes properly
  };
}
