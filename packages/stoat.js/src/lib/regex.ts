/**
 * Regular expression for mentions.
 */
export const RE_MENTIONS = /<@([ABCDEFGHJKMNPQRSTVWXYZ\d]{26})>/g;

/**
 * Regular expression for channels.
 */
export const RE_CHANNELS = /<#([ABCDEFGHJKMNPQRSTVWXYZ\d]{26})>/g;

/**
 * Regular expression for stripping custom emojis.
 */
export const RE_CUSTOM_EMOJI = /:([ABCDEFGHJKMNPQRSTVWXYZ\d]{26}):/g;

/**
 * Regular expression for spoilers.
 */
export const RE_SPOILER = /\|\|.+\|\|/g;
