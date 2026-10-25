import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";
import { saveProfile } from "../api.js";
import { clear, h } from "../dom.js";
import { auth } from "../firebase.js";

const ERRORS = {
  "auth/invalid-credential": "Wrong email or password.",
  "auth/invalid-email": "That email address doesn't look right.",
  "auth/email-already-in-use": "An account with that email already exists.",
  "auth/weak-password": "Password must be at least 6 characters.",
  "auth/too-many-requests": "Too many attempts. Try again in a moment.",
  "auth/operation-not-allowed":
    "This sign-in method isn't enabled in the Firebase console.",
};

function message(err) {
  return ERRORS[err.code] || err.message || "Something went wrong.";
}

export function renderAuth(container) {
  let mode = "login";

  const error = h("div", { class: "auth-error", role: "alert" });
  const name = h("input", {
    class: "input",
    name: "name",
    autocomplete: "nickname",
    maxLength: 32,
  });
  const email = h("input", {
    class: "input",
    name: "email",
    type: "email",
    autocomplete: "email",
    required: true,
  });
  const password = h("input", {
    class: "input",
    name: "password",
    type: "password",
    autocomplete: "current-password",
    minLength: 6,
    required: true,
  });
  const submit = h("button", { class: "btn primary block", type: "submit" });
  const nameField = h(
    "label",
    { class: "field" },
    h("span", { class: "field-label" }, "Display name"),
    name,
  );
  const title = h("h1", { class: "auth-title" });
  const subtitle = h("p", { class: "auth-subtitle" });
  const toggle = h("p", { class: "auth-toggle" });
  const forgot = h(
    "button",
    {
      type: "button",
      class: "link-btn",
      onclick: async () => {
        if (!email.value)
          return showError("Enter your email first, then click this again.");
        try {
          await sendPasswordResetEmail(auth, email.value);
          showError("Password reset email sent.", "ok");
        } catch (err) {
          showError(message(err));
        }
      },
    },
    "Forgot your password?",
  );

  function showError(text, kind = "error") {
    error.textContent = text || "";
    error.className = `auth-error ${kind}`;
  }

  function busy(on) {
    for (const el of form.querySelectorAll("button, input")) el.disabled = on;
  }

  function update() {
    const signup = mode === "signup";
    title.textContent = signup ? "Create an account" : "Welcome back!";
    subtitle.textContent = signup
      ? "Join the conversation on Sipher."
      : "We're so excited to see you again!";
    submit.textContent = signup ? "Continue" : "Log In";
    nameField.style.display = signup ? "" : "none";
    name.required = signup;
    forgot.style.display = signup ? "none" : "";
    password.autocomplete = signup ? "new-password" : "current-password";
    clear(toggle).append(
      signup ? "Already have an account? " : "Need an account? ",
      h(
        "button",
        {
          type: "button",
          class: "link-btn",
          onclick: () => {
            mode = signup ? "login" : "signup";
            showError("");
            update();
          },
        },
        signup ? "Log In" : "Register",
      ),
    );
  }

  const form = h(
    "form",
    {
      class: "auth-card",
      onsubmit: async (e) => {
        e.preventDefault();
        showError("");
        busy(true);
        try {
          if (mode === "signup") {
            const cred = await createUserWithEmailAndPassword(
              auth,
              email.value,
              password.value,
            );
            await updateProfile(cred.user, { displayName: name.value.trim() });
            await saveProfile(cred.user);
          } else {
            await signInWithEmailAndPassword(auth, email.value, password.value);
          }
        } catch (err) {
          showError(message(err));
          busy(false);
        }
      },
    },
    h("div", { class: "auth-logo" }, "S"),
    title,
    subtitle,
    nameField,
    h(
      "label",
      { class: "field" },
      h("span", { class: "field-label" }, "Email"),
      email,
    ),
    h(
      "label",
      { class: "field" },
      h("span", { class: "field-label" }, "Password"),
      password,
    ),
    forgot,
    error,
    submit,
    toggle,
  );

  update();
  clear(container).append(h("div", { class: "auth-screen" }, form));
}
