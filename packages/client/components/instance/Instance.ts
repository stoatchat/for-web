export default class Instance {
  readonly isStoat: boolean;
  readonly apiUrl: string;
  readonly wsUrl: string;
  readonly mediaUrl: string;
  readonly proxyUrl: string;
  readonly gifboxUrl: string;
  readonly hcaptcha_sitekey: string;
  readonly maxEmoji: number;
  readonly enableVideo: boolean;
  readonly hostname: string | undefined;

  // Not implemented, but should be fine for now
  // readonly maxReplies: number;
  // readonly maxAttachments: number;
  // readonly maxFileSize: number;
  // DEVELOPMENT_SESSION_ID
  // DEVELOPMENT_TOKEN
  // DEVELOPMENT_USER_ID

  constructor(
    apiUrl: string,
    wsUrl: string,
    mediaUrl: string,
    proxyUrl: string,
    gifboxUrl: string,
    hcaptcha_sitekey: string,
    maxEmoji: number,
    enableVideo: boolean,
    hostname?: string,
  ) {
    this.isStoat = [
      // historically...
      "https://api.revolt.chat",
      "https://beta.revolt.chat/api",
      "https://revolt.chat/api",
      // ... and now:
      "https://stoat.chat/api",
    ].includes(apiUrl);
    this.apiUrl = apiUrl;
    this.wsUrl = wsUrl;
    this.mediaUrl = mediaUrl;
    this.proxyUrl = proxyUrl;
    this.gifboxUrl = gifboxUrl;
    this.hcaptcha_sitekey = hcaptcha_sitekey;
    this.maxEmoji = maxEmoji;
    this.enableVideo = enableVideo;
    this.hostname = hostname;
  }

  /**
   * Prepends the given url with this instances' base path.
   * @param url - The url to link to.
   */
  href(url: string) {
    if (!this.hostname) {
      return url;
    }

    return `/instance/${this.hostname}${url}`;
  }
}
