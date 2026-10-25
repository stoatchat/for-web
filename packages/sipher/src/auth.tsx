import {
  type User,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { Match, Show, Switch, createSignal } from "solid-js";

import {
  createProfile,
  describeError,
  getProfile,
  joinDefaultServer,
} from "./data";
import { auth } from "./firebase";
import { ErrorText, Wordmark } from "./ui";

type Mode = "login" | "signup" | "reset";

function AuthLayout(props: { title: string; subtitle: string; children: any }) {
  return (
    <main class="auth">
      <div class="auth-card">
        <Wordmark />
        <h1>{props.title}</h1>
        <p class="muted">{props.subtitle}</p>
        {props.children}
      </div>
    </main>
  );
}

/** Wraps a form submit with busy and error state */
function useSubmit() {
  const [busy, setBusy] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  const run = async (task: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await task();
    } catch (err) {
      setError(describeError(err));
    } finally {
      setBusy(false);
    }
  };

  return { busy, error, run };
}

export function AuthScreen() {
  const [mode, setMode] = createSignal<Mode>("login");
  const [email, setEmail] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [resetSent, setResetSent] = createSignal(false);
  const { busy, error, run } = useSubmit();

  const switchTo = (next: Mode) => {
    setMode(next);
    setResetSent(false);
  };

  const submit = (event: SubmitEvent) => {
    event.preventDefault();
    run(async () => {
      if (mode() === "login") {
        await signInWithEmailAndPassword(auth, email().trim(), password());
      } else if (mode() === "signup") {
        const { user } = await createUserWithEmailAndPassword(
          auth,
          email().trim(),
          password(),
        );
        await sendEmailVerification(user);
      } else {
        await sendPasswordResetEmail(auth, email().trim());
        setResetSent(true);
      }
    });
  };

  return (
    <AuthLayout
      title={
        mode() === "login"
          ? "Welcome back"
          : mode() === "signup"
            ? "Create your account"
            : "Reset your password"
      }
      subtitle={
        mode() === "login"
          ? "Log in to pick up where you left off."
          : mode() === "signup"
            ? "Join Sipher and Da Group in a minute."
            : "We'll email you a link to choose a new password."
      }
    >
      <form class="stack" onSubmit={submit}>
        <label>
          Email
          <input
            type="email"
            name="email"
            autocomplete="email"
            required
            value={email()}
            onInput={(e) => setEmail(e.currentTarget.value)}
          />
        </label>
        <Show when={mode() !== "reset"}>
          <label>
            Password
            <input
              type="password"
              name="password"
              autocomplete={
                mode() === "signup" ? "new-password" : "current-password"
              }
              minLength={6}
              required
              value={password()}
              onInput={(e) => setPassword(e.currentTarget.value)}
            />
          </label>
        </Show>
        <ErrorText error={error()} />
        <Show when={resetSent()}>
          <p class="notice" role="status">
            If there's an account for {email()}, a reset link from Sipher is on
            its way. Check your spam folder too.
          </p>
        </Show>
        <button class="primary" type="submit" disabled={busy()}>
          {mode() === "login"
            ? "Log in"
            : mode() === "signup"
              ? "Create account"
              : "Send reset link"}
        </button>
      </form>

      <div class="auth-links">
        <Switch>
          <Match when={mode() === "login"}>
            <button class="link" onClick={() => switchTo("reset")}>
              Forgot password?
            </button>
            <span>
              New to Sipher?{" "}
              <button class="link" onClick={() => switchTo("signup")}>
                Create an account
              </button>
            </span>
          </Match>
          <Match when={mode() !== "login"}>
            <button class="link" onClick={() => switchTo("login")}>
              Back to log in
            </button>
          </Match>
        </Switch>
      </div>
    </AuthLayout>
  );
}

export function VerifyScreen(props: { user: User; onVerified: () => void }) {
  const { busy, error, run } = useSubmit();
  const [notice, setNotice] = createSignal<string | null>(null);

  const check = () =>
    run(async () => {
      setNotice(null);
      await props.user.reload();
      if (!props.user.emailVerified) {
        setNotice("Not verified yet. Click the link in the email first.");
        return;
      }
      // refresh the token so the database sees the verified email
      await props.user.getIdToken(true);
      props.onVerified();
    });

  const resend = () =>
    run(async () => {
      await sendEmailVerification(props.user);
      setNotice("Sent! Check your inbox and spam folder.");
    });

  return (
    <AuthLayout
      title="Check your email"
      subtitle={`We sent a verification link from Sipher to ${props.user.email}. Click it, then come back here.`}
    >
      <div class="stack">
        <ErrorText error={error()} />
        <Show when={notice()}>
          <p class="notice" role="status">
            {notice()}
          </p>
        </Show>
        <button class="primary" disabled={busy()} onClick={check}>
          I've verified my email
        </button>
        <button disabled={busy()} onClick={resend}>
          Resend email
        </button>
        <button class="link" onClick={() => signOut(auth)}>
          Use a different account
        </button>
      </div>
    </AuthLayout>
  );
}

export function UsernameScreen(props: { user: User }) {
  const [username, setUsername] = createSignal("");
  const [displayName, setDisplayName] = createSignal("");
  const { busy, error, run } = useSubmit();

  const submit = (event: SubmitEvent) => {
    event.preventDefault();
    run(async () => {
      const name = username().trim().toLowerCase();
      await createProfile(
        props.user.uid,
        name,
        displayName().trim() || username().trim(),
      );
      const profile = await getProfile(props.user.uid);
      // don't hold up sign up if this fails; they can join with a code later
      if (profile)
        await joinDefaultServer(profile).catch((err) =>
          console.error("Couldn't join Da Group:", err),
        );
    });
  };

  return (
    <AuthLayout
      title="Pick a username"
      subtitle="This is how people find you. You can't change it later."
    >
      <form class="stack" onSubmit={submit}>
        <label>
          Username
          <input
            name="username"
            autocomplete="username"
            required
            minLength={3}
            maxLength={20}
            pattern="[A-Za-z0-9_]{3,20}"
            title="3–20 letters, numbers or underscores"
            value={username()}
            onInput={(e) => setUsername(e.currentTarget.value)}
          />
        </label>
        <label>
          Display name <span class="muted">(optional)</span>
          <input
            name="displayName"
            maxLength={32}
            placeholder={username() || "Shown next to your messages"}
            value={displayName()}
            onInput={(e) => setDisplayName(e.currentTarget.value)}
          />
        </label>
        <ErrorText error={error()} />
        <button class="primary" type="submit" disabled={busy()}>
          Continue
        </button>
        <button type="button" class="link" onClick={() => signOut(auth)}>
          Log out
        </button>
      </form>
    </AuthLayout>
  );
}
