import { type JSX, Show, onCleanup, onMount } from "solid-js";

/** The purple lightning bolt */
export function Bolt(props: { size?: number }) {
  return (
    <svg
      class="bolt"
      width={props.size ?? 24}
      height={props.size ?? 24}
      viewBox="0 0 64 96"
      aria-hidden="true"
    >
      <path
        d="M44 2 L8 52 H31 L24 92 L60 40 H37 L44 2 Z"
        fill="#A855F7"
        stroke="#A855F7"
        stroke-width="4"
        stroke-linejoin="round"
      />
    </svg>
  );
}

export function Wordmark() {
  return (
    <div class="wordmark">
      <Bolt size={34} />
      <span>sipher</span>
    </div>
  );
}

/** First letters of a name, for avatars and server icons */
export function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => [...word][0])
      .join("")
      .toUpperCase() || "?"
  );
}

/** Stable colour for a name */
export function colourFor(text: string) {
  let hash = 0;
  for (const char of text) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return `hsl(${Math.abs(hash) % 360} 55% 45%)`;
}

export function Avatar(props: { name: string; seed: string; size?: number }) {
  return (
    <div
      class="avatar"
      style={{
        background: colourFor(props.seed),
        width: `${props.size ?? 36}px`,
        height: `${props.size ?? 36}px`,
        "font-size": `${(props.size ?? 36) * 0.4}px`,
      }}
      aria-hidden="true"
    >
      {initials(props.name)}
    </div>
  );
}

export function Modal(props: {
  title: string;
  onClose: () => void;
  children: JSX.Element;
}) {
  const onKey = (event: KeyboardEvent) => {
    if (event.key === "Escape") props.onClose();
  };
  onMount(() => document.addEventListener("keydown", onKey));
  onCleanup(() => document.removeEventListener("keydown", onKey));

  return (
    <div class="modal-backdrop" onClick={props.onClose}>
      <div
        class="modal"
        role="dialog"
        aria-modal="true"
        aria-label={props.title}
        onClick={(event) => event.stopPropagation()}
      >
        <h2>{props.title}</h2>
        {props.children}
      </div>
    </div>
  );
}

export function ErrorText(props: { error: string | null | undefined }) {
  return (
    <Show when={props.error}>
      <p class="error" role="alert">
        {props.error}
      </p>
    </Show>
  );
}

/** Plain text with web links made clickable */
export function Linkified(props: { text: string }) {
  const parts = () => props.text.split(/(https?:\/\/[^\s<]+)/g);
  return (
    <>
      {parts().map((part, index) =>
        index % 2 === 1 ? (
          <a href={part} target="_blank" rel="noopener noreferrer">
            {part}
          </a>
        ) : (
          part
        ),
      )}
    </>
  );
}
