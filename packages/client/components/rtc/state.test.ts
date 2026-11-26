import { createRoot } from "solid-js";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

/**
 * Stand-in for a LiveKit room. `connect()` only settles when the test says
 * so, which lets the test switch channels while a connection is still being
 * set up. Like the real thing, a connect that is already under way can
 * still complete after `disconnect()` was called.
 */
class FakeRoom {
  static instances: FakeRoom[] = [];

  connected = false;
  localParticipant = { setMicrophoneEnabled: vi.fn(async () => null) };
  remoteParticipants = new Map();

  private finishConnect?: () => void;
  private listeners = new Map<string, () => void>();

  /**
   * Construct a room and remember it for the assertions
   */
  constructor() {
    FakeRoom.instances.push(this);
  }

  /**
   * Start connecting; finishes once `completeConnect()` is called
   */
  connect = vi.fn(
    () =>
      new Promise<void>((resolve) => {
        this.finishConnect = () => {
          this.connected = true;
          resolve();
          this.listeners.get("connected")?.();
        };
      }),
  );

  /**
   * Let a pending `connect()` finish and tell the listeners
   */
  completeConnect() {
    this.finishConnect?.();
  }

  /**
   * Leave the room
   */
  disconnect() {
    this.connected = false;
    return Promise.resolve();
  }

  /**
   * Register a listener, only "connected" is ever called
   */
  addListener(event: string, listener: () => void) {
    this.listeners.set(event, listener);
    return this;
  }

  /**
   * Forget all listeners
   */
  removeAllListeners() {
    this.listeners.clear();
    return this;
  }
}

vi.mock("livekit-client", () => ({
  Room: FakeRoom,
  Track: {
    Source: {
      Camera: "camera",
      Microphone: "microphone",
      ScreenShare: "screen_share",
      ScreenShareAudio: "screen_share_audio",
    },
  },
  VideoPresets: { h720: { resolution: {}, encoding: {} } },
  ScreenSharePresets: {
    h720fps30: { resolution: {}, encoding: {} },
    h1080fps30: { resolution: {}, encoding: {} },
    original: { resolution: {}, encoding: {} },
  },
}));

vi.mock("solid-livekit-components", () => ({
  RoomContext: {},
  useTracks: () => () => [],
}));

vi.mock("@revolt/client", () => ({ useSound: vi.fn() }));
vi.mock("@revolt/common", () => ({ useDevice: vi.fn() }));
vi.mock("@revolt/modal", () => ({ useModals: vi.fn() }));
vi.mock("@revolt/state", () => ({ useState: vi.fn() }));
vi.mock("@revolt/instance", () => ({
  useInstance: () => ({
    config: {
      features: {
        livekit: { nodes: [{ name: "node", public_url: "wss://node" }] },
      },
    },
    limits: () => ({}),
  }),
}));
vi.mock("@revolt/ui/components/features/voice/callCard/VoiceCallCard", () => ({
  VoiceCallCardContext: () => null,
}));
vi.mock("./components/InRoom", () => ({ InRoom: () => null }));
vi.mock("./components/RoomAudioManager", () => ({
  RoomAudioManager: () => null,
}));
vi.mock("./VoiceProcessor", () => ({ VoiceProcessor: class {} }));

const { Voice } = await import("./state");

type VoiceState = InstanceType<typeof Voice>;

/**
 * Rooms still connected to the server that the client no longer tracks,
 * so nothing will ever disconnect them
 */
const zombies = (voice: VoiceState) =>
  FakeRoom.instances.filter(
    (room) => room.connected && room !== (voice.room() as unknown),
  );

/**
 * Channel whose `joinCall()` only settles when `finishJoin()` is called
 */
const channel = (id: string) => {
  let finishJoin = () => {};
  const joined = new Promise<{ url: string; token: string }>((resolve) => {
    finishJoin = () => resolve({ url: `wss://${id}`, token: id });
  });

  return {
    id,
    havePermission: () => true,
    joinCall: vi.fn(() => joined),
    finishJoin: () => finishJoin(),
  };
};

type TestChannel = ReturnType<typeof channel>;

/**
 * Let pending promise callbacks run
 */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

/**
 * Voice state with stubbed settings, modals, sounds and device
 */
const createVoice = () =>
  createRoot(
    () =>
      new Voice(
        {
          echoCancellation: true,
          autoGainControl: true,
          noiseSupression: "browser",
          micOn: true,
          deafen: false,
        } as never,
        { openModal: vi.fn() } as never,
        { playSound: vi.fn() } as never,
        { setWakeLocked: vi.fn(), releaseWakeLock: vi.fn() } as never,
      ),
  );

/**
 * Check that the client ended up in `target`'s call: its room connected with
 * that channel's credentials, the microphone is on, and nothing else is
 * connected or has its microphone turned on
 */
const expectOnlyIn = (voice: VoiceState, target: TestChannel) => {
  const room = voice.room() as unknown as FakeRoom;

  expect(voice.channel()?.id).toBe(target.id);
  expect(voice.state()).toBe("CONNECTED");
  expect(target.joinCall).toHaveBeenCalledTimes(1);
  expect(room.connect).toHaveBeenCalledWith(
    `wss://${target.id}`,
    target.id,
    expect.anything(),
  );
  expect(room.connected).toBe(true);
  expect(room.localParticipant.setMicrophoneEnabled).toHaveBeenCalled();

  expect(zombies(voice)).toEqual([]);
  FakeRoom.instances
    .filter((other) => other !== room)
    .forEach((other) =>
      expect(
        other.localParticipant.setMicrophoneEnabled,
      ).not.toHaveBeenCalled(),
    );
};

/**
 * Start joining the given channel
 */
const join = (voice: VoiceState, target: TestChannel) =>
  voice.connect(target as never);

describe("Voice: switching channels quickly", () => {
  beforeEach(() => {
    FakeRoom.instances = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(new Response())),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("joining a single channel connects to it", async () => {
    const voice = createVoice();
    const a = channel("a");

    const joining = join(voice, a);
    a.finishJoin();
    await settle();
    FakeRoom.instances.forEach((room) => room.completeConnect());
    await joining;

    expect(FakeRoom.instances).toHaveLength(1);
    expectOnlyIn(voice, a);
  });

  test("a channel left before its call was joined never connects", async () => {
    const voice = createVoice();
    const a = channel("a");
    const b = channel("b");

    const joiningA = join(voice, a);
    await settle(); // A is now waiting for joinCall()

    const joiningB = join(voice, b);
    await settle();

    a.finishJoin(); // A's join completes after the user already moved on
    b.finishJoin();
    await settle();
    FakeRoom.instances.forEach((room) => room.completeConnect());
    await Promise.allSettled([joiningA, joiningB]);

    const [roomA, roomB] = FakeRoom.instances;
    expect(voice.room()).toBe(roomB);
    expect(roomA.connect).not.toHaveBeenCalled();
    expectOnlyIn(voice, b);
  });

  test("a channel left while its room was connecting does not stay connected", async () => {
    const voice = createVoice();
    const a = channel("a");
    const b = channel("b");

    const joiningA = join(voice, a);
    a.finishJoin();
    await settle(); // A's room.connect() is now under way

    const joiningB = join(voice, b);
    b.finishJoin();
    await settle();

    FakeRoom.instances.forEach((room) => room.completeConnect());
    await Promise.allSettled([joiningA, joiningB]);
    await settle();

    const [, roomB] = FakeRoom.instances;
    expect(voice.room()).toBe(roomB);
    expectOnlyIn(voice, b);
  });

  test("many quick switches leave only the last channel connected", async () => {
    const voice = createVoice();
    const channels = ["a", "b", "c", "d", "e"].map(channel);

    const joins = channels.map((target) => join(voice, target));
    await settle();

    // complete everything in reverse order, the worst case for stale joins
    [...channels].reverse().forEach((target) => target.finishJoin());
    await settle();
    [...FakeRoom.instances].reverse().forEach((room) => room.completeConnect());
    await Promise.allSettled(joins);
    await settle();

    const connected = FakeRoom.instances.filter((room) => room.connected);
    expect(connected).toEqual([FakeRoom.instances.at(-1)]);
    expect(voice.room()).toBe(FakeRoom.instances.at(-1));
    expectOnlyIn(voice, channels[4]);
  });
});
