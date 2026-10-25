import { type User, onAuthStateChanged } from "firebase/auth";
import { Match, Switch, createEffect, createSignal, onCleanup } from "solid-js";
import { render } from "solid-js/web";

import { AuthScreen, UsernameScreen, VerifyScreen } from "./auth";
import { ChatApp } from "./chat";
import { type Profile, watchProfile } from "./data";
import { auth } from "./firebase";
import "./styles.css";

function App() {
  // undefined while Firebase is still working out who's logged in
  const [user, setUser] = createSignal<User | null | undefined>(undefined);
  const [verified, setVerified] = createSignal(false);
  const [profile, setProfile] = createSignal<Profile | null | undefined>(
    undefined,
  );

  onCleanup(
    onAuthStateChanged(auth, (next) => {
      setUser(next);
      setVerified(next?.emailVerified ?? false);
    }),
  );

  createEffect(() => {
    const current = user();
    setProfile(undefined);
    if (!current || !verified()) return;
    onCleanup(watchProfile(current.uid, setProfile));
  });

  return (
    <Switch>
      <Match when={user() === undefined}>
        <div class="loading">Loading…</div>
      </Match>
      <Match when={user() === null}>
        <AuthScreen />
      </Match>
      <Match when={!verified()}>
        <VerifyScreen user={user()!} onVerified={() => setVerified(true)} />
      </Match>
      <Match when={profile() === undefined}>
        <div class="loading">Loading…</div>
      </Match>
      <Match when={profile() === null}>
        <UsernameScreen user={user()!} />
      </Match>
      <Match when={profile()}>
        {(current) => <ChatApp user={user()!} profile={current()} />}
      </Match>
    </Switch>
  );
}

render(() => <App />, document.getElementById("root")!);
