import type { DataCreateAccount, WebPushSubscription } from "stoat-api";

import type { Client } from "../Client.js";
import { MFA, MFATicket } from "../classes/MFA.js";

/**
 * Utility functions for working with accounts
 */
export class AccountCollection {
  readonly client: Client;

  /**
   * Create generic class collection
   * @param client Client
   */
  constructor(client: Client) {
    this.client = client;
  }

  /**
   * Fetch current account email
   * @returns Email
   */
  async fetchEmail(): Promise<string> {
    return (await this.client.api.get("/auth/account/")).email;
  }

  /**
   * Create a MFA helper
   */
  async mfa(): Promise<MFA> {
    return new MFA(this.client, await this.client.api.get("/auth/mfa/"));
  }

  /**
   * Create a new account
   * @param data Account details
   */
  create(data: DataCreateAccount): Promise<void> {
    return this.client.api.post("/auth/account/create", data);
  }

  /**
   * Resend email verification
   * @param email Email
   * @param captcha Captcha if enabled
   */
  reverify(email: string, captcha?: string): Promise<void> {
    return this.client.api.post("/auth/account/reverify", { email, captcha });
  }

  /**
   * Send password reset email
   * @param email Email
   * @param captcha Captcha if enabled
   */
  resetPassword(email: string, captcha?: string): Promise<void> {
    return this.client.api.post("/auth/account/reset_password", {
      email,
      captcha,
    });
  }

  /**
   * Verify an account given the code
   * @param code Verification code
   */
  verify(code: string): Promise<unknown> {
    return this.client.api.post(`/auth/account/verify/${code}`);
  }

  /**
   * Confirm account deletion
   * @param token Deletion token
   */
  confirmDelete(token: string): Promise<void> {
    return this.client.api.put("/auth/account/delete", { token });
  }

  /**
   * Confirm password reset
   * @param token Token
   * @param newPassword New password
   * @param removeSessions Whether to remove existing sessions
   */
  confirmPasswordReset(
    token: string,
    newPassword: string,
    removeSessions: boolean,
  ): Promise<void> {
    return this.client.api.patch("/auth/account/reset_password", {
      token,
      password: newPassword,
      remove_sessions: removeSessions,
    });
  }

  /**
   * Change account password
   * @param newPassword New password
   * @param currentPassword Current password
   */
  changePassword(newPassword: string, currentPassword: string): Promise<void> {
    return this.client.api.patch("/auth/account/change/password", {
      password: newPassword,
      current_password: currentPassword,
    });
  }

  /**
   * Change account email
   * @param newEmail New email
   * @param currentPassword Current password
   * @param ticket MFA ticket, mandatory if account has MFA enabled
   */
  changeEmail(
    newEmail: string,
    currentPassword: string,
    ticket?: MFATicket,
  ): Promise<void> {
    ticket?._consume();
    return this.client.api.patch(
      "/auth/account/change/email",
      {
        email: newEmail,
        current_password: currentPassword,
      },
      ticket ? { headers: { "X-MFA-Ticket": ticket.token } } : undefined,
    );
  }

  /**
   * Fetch settings
   * @param keys Keys
   * @returns Settings
   */
  fetchSettings(keys: string[]): Promise<Record<string, [number, string]>> {
    return this.client.api.post("/sync/settings/fetch", { keys }) as Promise<
      Record<string, [number, string]>
    >;
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  /**
   * Set settings
   * @param settings Settings
   * @param timestamp Timestamp
   */
  setSettings(
    settings: Record<string, any>,
    timestamp = +new Date(),
  ): Promise<void> {
    return this.client.api.post("/sync/settings/set", {
      ...settings,
      timestamp,
    });
  }
  /* eslint-enable @typescript-eslint/no-explicit-any */

  /**
   * Create a new Web Push subscription
   * @param subscription Subscription
   */
  webPushSubscribe(subscription: WebPushSubscription): Promise<void> {
    return this.client.api.post("/push/subscribe", subscription);
  }

  /**
   * Remove existing Web Push subscription
   */
  webPushUnsubscribe(): Promise<void> {
    return this.client.api.post("/push/unsubscribe");
  }
}
