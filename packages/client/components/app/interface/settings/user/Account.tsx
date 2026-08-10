import { Match, Show, Switch, createMemo, createSignal } from "solid-js";

import { Trans, useLingui } from "@lingui/solid/macro";

import { useClient, useClientLifecycle } from "@revolt/client";
import {
  createMfaResource,
  createOwnProfileResource,
} from "@revolt/client/resources";
import { useModals } from "@revolt/modal";
import { CategoryButton, Column, Row, iconSize, useSnackbar } from "@revolt/ui";

import MdAlternateEmail from "@material-design-icons/svg/outlined/alternate_email.svg?component-solid";
import MdBlock from "@material-design-icons/svg/outlined/block.svg?component-solid";
import MdDelete from "@material-design-icons/svg/outlined/delete.svg?component-solid";
import MdLock from "@material-design-icons/svg/outlined/lock.svg?component-solid";
import MdMail from "@material-design-icons/svg/outlined/mail.svg?component-solid";
import MdPassword from "@material-design-icons/svg/outlined/password.svg?component-solid";
import MdVerifiedUser from "@material-design-icons/svg/outlined/verified_user.svg?component-solid";

import { useSettingsNavigation } from "../Settings";

import { UserSummary } from "./account/index";

/**
 * Account Page
 */
export function MyAccount() {
  const client = useClient();
  const profile = createOwnProfileResource();
  const { navigate } = useSettingsNavigation();

  return (
    <Column gap="lg">
      <UserSummary
        user={client().user!}
        bannerUrl={profile.data?.animatedBannerURL}
        onEdit={() => navigate("profile")}
        showBadges
      />
      <EditAccount />
      <MultiFactorAuth />
      <ManageAccount />
    </Column>
  );
}

/**
 * Edit account details
 */
function EditAccount() {
  const client = useClient();
  const { openModal } = useModals();
  const [email, setEmail] = createSignal("•••••••••••@•••••••••••");

  return (
    <CategoryButton.Group>
      <CategoryButton
        action="chevron"
        onClick={() =>
          openModal({
            type: "edit_username",
            client: client(),
          })
        }
        icon={<MdAlternateEmail {...iconSize(22)} />}
        description={client().user?.username}
      >
        <Trans>Username</Trans>
      </CategoryButton>
      <CategoryButton
        action="chevron"
        onClick={() =>
          openModal({
            type: "edit_email",
            client: client(),
          })
        }
        icon={<MdMail {...iconSize(22)} />}
        description={
          <Row>
            {email()}{" "}
            <Show when={email().startsWith("•")}>
              <a
                onClick={(event) => {
                  event.stopPropagation();
                  client().account.fetchEmail().then(setEmail);
                }}
              >
                Reveal
              </a>
            </Show>
          </Row>
        }
      >
        <Trans>Email</Trans>
      </CategoryButton>
      <CategoryButton
        action="chevron"
        onClick={() =>
          openModal({
            type: "edit_password",
            client: client(),
          })
        }
        icon={<MdPassword {...iconSize(22)} />}
        description={"•••••••••"}
      >
        <Trans>Password</Trans>
      </CategoryButton>
    </CategoryButton.Group>
  );
}

/**
 * Multi-factor authentication
 */
function MultiFactorAuth() {
  const client = useClient();
  const mfa = createMfaResource();
  const snackbar = useSnackbar();
  const { t } = useLingui();
  const { openModal, mfaFlow, mfaEnableTOTP, showError } = useModals();

  /**
   * Show recovery codes
   */
  async function showRecoveryCodes() {
    const ticket = await mfaFlow(mfa.data!);

    ticket!.fetchRecoveryCodes().then((codes) =>
      openModal({
        type: "mfa_recovery",
        mfa: mfa.data!,
        codes,
      }),
    );
  }

  /**
   * Generate recovery codes
   */
  async function generateRecoveryCodes() {
    const ticket = await mfaFlow(mfa.data!);

    ticket!.generateRecoveryCodes().then((codes) =>
      openModal({
        type: "mfa_recovery",
        mfa: mfa.data!,
        codes,
      }),
    );
  }

  /**
   * Configure authenticator app
   */
  async function setupAuthenticatorApp() {
    const ticket = await mfaFlow(mfa.data!);
    if (!ticket) {
      snackbar.show({ message: t`MFA setup canceled.` });
      return;
    }
    const secret = await ticket!.generateAuthenticatorSecret();

    try {
      const enabled = await mfaEnableTOTP(
        secret,
        client().user!.username,
        (code) => mfa.data!.enableAuthenticator(code),
      );

      if (!enabled) {
        snackbar.show({ message: t`MFA setup canceled.` });
      }
    } catch (err) {
      if (err === "MFACancelled") {
        snackbar.show({ message: t`MFA setup canceled.` });
        return;
      }

      showError(err);
    }
  }

  /**
   * Disable authenticator app
   */
  function disableAuthenticatorApp() {
    mfaFlow(mfa.data!).then((ticket) => ticket!.disableAuthenticator());
  }

  return (
    <CategoryButton.Group>
      <CategoryButton.Collapse
        icon={<MdVerifiedUser {...iconSize(22)} />}
        title={<Trans>Recovery Codes</Trans>}
        description={
          <Trans>
            Configure a way to get back into your account in case your 2FA is
            lost
          </Trans>
        }
      >
        <Switch
          fallback={
            <CategoryButton
              icon="blank"
              disabled={mfa.isLoading}
              onClick={generateRecoveryCodes}
              description={<Trans>Setup recovery codes</Trans>}
            >
              <Trans>Generate Recovery Codes</Trans>
            </CategoryButton>
          }
        >
          <Match when={!mfa.isLoading && mfa.data?.recoveryEnabled}>
            <CategoryButton
              icon="blank"
              description={<Trans>Get active recovery codes</Trans>}
              onClick={showRecoveryCodes}
            >
              <Trans>View Recovery Codes</Trans>
            </CategoryButton>
            <CategoryButton
              icon="blank"
              description={<Trans>Get a new set of recovery codes</Trans>}
              onClick={generateRecoveryCodes}
            >
              <Trans>Reset Recovery Codes</Trans>
            </CategoryButton>
          </Match>
        </Switch>
      </CategoryButton.Collapse>
      <CategoryButton.Collapse
        icon={<MdLock {...iconSize(22)} />}
        title={<Trans>Authenticator App</Trans>}
        description={<Trans>Configure one-time password authentication</Trans>}
      >
        <Switch
          fallback={
            <CategoryButton
              icon="blank"
              disabled={mfa.isLoading}
              onClick={setupAuthenticatorApp}
              description={<Trans>Setup one-time password authenticator</Trans>}
            >
              <Trans>Enable Authenticator</Trans>
            </CategoryButton>
          }
        >
          <Match when={!mfa.isLoading && mfa.data?.authenticatorEnabled}>
            <CategoryButton
              icon="blank"
              description={
                <Trans>Disable one-time password authenticator</Trans>
              }
              onClick={disableAuthenticatorApp}
            >
              <Trans>Remove Authenticator</Trans>
            </CategoryButton>
          </Match>
        </Switch>
      </CategoryButton.Collapse>
    </CategoryButton.Group>
  );
}

/**
 * Manage account
 */
function ManageAccount() {
  const client = useClient();
  const mfa = createMfaResource();
  const { mfaFlow } = useModals();
  const { logout } = useClientLifecycle();

  const stillOwnServers = createMemo(
    () =>
      client().servers.filter((server) => server.owner?.self || false).length >
      0,
  );

  /**
   * Disable account
   */
  function disableAccount() {
    mfaFlow(mfa.data!).then((ticket) =>
      ticket!.disableAccount().then(() => logout()),
    );
  }

  /**
   * Delete account
   */
  function deleteAccount() {
    mfaFlow(mfa.data!).then((ticket) =>
      ticket!.deleteAccount().then(() => logout()),
    );
  }

  return (
    <CategoryButton.Group>
      <CategoryButton
        action="chevron"
        disabled={mfa.isLoading}
        onClick={disableAccount}
        icon={<MdBlock {...iconSize(22)} fill="var(--md-sys-color-error)" />}
        description={
          <Trans>
            You won't be able to access your account unless you contact support
            - however, your data will not be deleted.
          </Trans>
        }
      >
        <Trans>Disable Account</Trans>
      </CategoryButton>
      <CategoryButton
        action={stillOwnServers() ? undefined : "chevron"}
        disabled={mfa.isLoading || stillOwnServers()}
        onClick={deleteAccount}
        icon={<MdDelete {...iconSize(22)} fill="var(--md-sys-color-error)" />}
        description={
          <Trans>
            Your account and all of your data (including your messages and
            friends list) will be queued for deletion. A confirmation email will
            be sent - you can cancel this within 7 days by contacting support.
          </Trans>
        }
      >
        <Switch fallback={<Trans>Delete Account</Trans>}>
          <Match when={stillOwnServers()}>
            <Trans>
              Cannot delete account until servers are deleted or transferred
            </Trans>
          </Match>
        </Switch>
      </CategoryButton>
    </CategoryButton.Group>
  );
}
