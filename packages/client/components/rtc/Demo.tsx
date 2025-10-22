import { Match, Show, Switch } from "solid-js";
import {
  TrackLoop,
  TrackReference,
  VideoTrack,
  isTrackReference,
  useEnsureParticipant,
  useIsMuted,
  useIsSpeaking,
  useTrackRefContext,
  useTracks,
} from "solid-livekit-components";

import { Track } from "livekit-client";
import { Channel } from "stoat.js";
import { css } from "styled-system/css";
import { styled } from "styled-system/jsx";

import { UserContextMenu } from "@revolt/app";
import { useClient } from "@revolt/client";
import { useUser } from "@revolt/markdown/users";
import { useSmartParams } from "@revolt/routing";
import {
  Avatar,
  Button,
  Column,
  IconButton,
  OverflowingText,
  Row,
  iconSize,
} from "@revolt/ui";

import MdHeadset from "@material-design-icons/svg/outlined/headset.svg?component-solid";
import MdHeadsetOff from "@material-design-icons/svg/outlined/headset_off.svg?component-solid";
import MdMicOn from "@material-design-icons/svg/outlined/mic.svg?component-solid";
import MdMicOff from "@material-design-icons/svg/outlined/mic_off.svg?component-solid";

import { InRoom, useVoice } from ".";

export function RoomParticipants() {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  );

  return (
    <div
      class={css({
        gap: "0.8em",
        padding: "1.6em",

        minHeight: 0,
        overflowX: "hidden",
        overflowY: "scroll",

        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",

        // display: 'grid',
        // gridAutoRows:'1fr',
        // gridTemplateColumns:'repeat(auto-fill, minmax(0, 1fr))',
      })}
    >
      <TrackLoop tracks={tracks}>{() => <LeParticipant />}</TrackLoop>
    </div>
  );
}

export function FakeParticipants() {
  return (
    <div
      class={css({
        gap: "0.8em",
        padding: "1.6em",

        minHeight: 0,
        overflowX: "hidden",
        overflowY: "scroll",
        display: "grid",
        gridAutoRows: "1fr",
        gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
      })}
    >
      <Tile />
      <Tile />
      <Tile />
      <Tile />
      <Tile />
      <Tile />
      <Tile />
      <Tile />
      <Tile />
      <Tile />
      <Tile />
      <Tile />
      <Tile />
    </div>
  );
}

const Tile = styled("div", {
  base: {
    minWidth: "240px",
    maxWidth: "240px",
    display: "grid",
    aspectRatio: "16/9",
    transition: ".3s ease all",
    borderRadius: "var(--borderRadius-lg)",
    background: "#0001",
    overflow: "hidden",
    outlineWidth: "3px",
    outlineStyle: "solid",
    outlineOffset: "-3px",
    outlineColor: "transparent",
  },
  variants: {
    speaking: {
      yes: {
        outlineColor: "#23a559",
      },
    },
  },
});

export function LeParticipant() {
  const participant = useEnsureParticipant();
  const track = useTrackRefContext();
  const isMuted = useIsMuted({
    participant,
    source: Track.Source.Microphone,
  });
  const isSpeaking = useIsSpeaking(participant);

  const user = useUser(participant.identity);

  return (
    <Tile speaking={isSpeaking() ? "yes" : undefined}>
      {/*{participant.identity}<br/>muted? {isMuted() ? 'yes' : 'no'}*/}
      <Switch
        fallback={
          <div
            class={css({
              gridArea: "1/1",
              display: "grid",
              placeItems: "center",
            })}
            // yeah good enough lmao
            use:floating={{
              contextMenu: () => (
                <UserContextMenu user={user().user!} member={user().member!} />
              ),
            }}
          >
            <Avatar
              src={user().avatar}
              fallback={user().username}
              size={64}
              interactive={false}
            />
          </div>
        }
      >
        <Match
          when={
            isTrackReference(track) &&
            (track.publication?.kind === "video" ||
              track.source === Track.Source.Camera ||
              track.source === Track.Source.ScreenShare)
          }
        >
          <VideoTrack
            style={{ "grid-area": "1/1" }}
            trackRef={track as TrackReference}
            manageSubscription={true}
          />
        </Match>
      </Switch>
      <div
        class={css({
          minWidth: 0,
          gridArea: "1/1",
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "end",
          padding: "2",
          fontSize: "0.8em",
          textShadow: isTrackReference(track) ? "1px 1px 4px black" : "",
          // color: isTrackReference(track) ? 'white' : 'black',
          color: "transparent",
          fill: isTrackReference(track) ? "white" : "black",
        })}
      >
        <span class={css({ minWidth: 0 })}>
          <OverflowingText>{participant.identity}</OverflowingText>
        </span>
        <Show when={isMuted()}>
          <div
            class={css({
              borderRadius: "100%",
              background: isTrackReference(track) ? "#0006" : "#0001",
              padding: "1",
            })}
          >
            <MdMicOff {...iconSize(20)} />
          </div>
        </Show>
      </div>
    </Tile>
  );
}

export function DemoWrapper(props: { channel: Channel }) {
  const voice = useVoice()!;

  const shouldShow = () => {
    const room = voice.room();
    return !room
      ? !!props.channel.server
      : voice.channel()?.id === props.channel.id;
  };

  return (
    <Switch>
      <Match when={shouldShow()}>
        <Demo channel={props.channel} />
      </Match>
    </Switch>
  );
}

export function Demo(props: { channel: Channel }) {
  const client = useClient();
  const voice = useVoice()!;

  /**
   * Join voice call
   * copy pasted from channelheader
   * todo: make this consistnet
   */
  async function joinCall() {
    voice.connect(props.channel);
  }

  return (
    /*<div>
      state: {voice.state()}
      <br />
      <Switch
        fallback={
          <>
            <Button onPress={() => voice.disconnect()}>Disconnect</Button>
            <br />
            <Button onPress={() => voice.toggleMute()}>
              <Switch fallback="Muted">
                <Match when={voice.microphone()}>Unmuted</Match>
              </Switch>
            </Button>
            <br />
            <Button onPress={() => voice.toggleCamera()}>
              <Switch fallback="Camera">
                <Match when={voice.video()}>Sharing camera</Match>
              </Switch>
            </Button>
            <br />
            <Button onPress={() => voice.toggleScreenshare()}>
              <Switch fallback="Share screen">
                <Match when={voice.screenshare()}>Sharing screen</Match>
              </Switch>
            </Button>
          </>
        }
      >
        <Match when={voice.state() === "READY"}>
          <Button onPress={() => voice.connect()}>Connect</Button>
        </Match>
      </Switch>
    </div>*/
    <Column
      class={css({
        height: "400px",
      })}
    >
      {/* <FakeParticipants /> */}
      <Show when={voice.state() === "CONNECTING"}>
        <span>Connecting...</span>
      </Show>
      <InRoom>
        <RoomParticipants />
      </InRoom>
      <div
        class={css({
          flexGrow: 1,
        })}
      />
      <Row justify>
        <Actions>
          <Show when={voice.state() !== "READY"}>
            <div
              use:floating={{
                tooltip: props.channel.havePermission("Speak")
                  ? undefined
                  : {
                      placement: "top",
                      content: "No permission to speak",
                    },
              }}
            >
              <IconButton
                variant={voice.microphone() ? "filled" : "tonal"}
                isDisabled={!props.channel.havePermission("Speak")}
                onPress={() => voice.toggleMute()}
              >
                <Switch fallback={<MdMicOff {...iconSize(20)} />}>
                  <Match when={voice.microphone()}>
                    <MdMicOn {...iconSize(20)} />
                  </Match>
                </Switch>
              </IconButton>
            </div>
          </Show>

          <Show when={!props.channel.havePermission("Listen")}>
            <div
              use:floating={{
                tooltip: {
                  placement: "top",
                  content: "You are deafened (or missing Listen permission)",
                },
              }}
            >
              <IconButton variant="tonal" isDisabled>
                <MdHeadsetOff {...iconSize(20)} />
              </IconButton>
            </div>
          </Show>

          <Switch
            fallback={
              <Button onPress={() => voice.disconnect()}>Leave Call</Button>
            }
          >
            <Match when={voice.state() === "READY"}>
              <Button onPress={joinCall}>Join Call</Button>
            </Match>
          </Switch>

          <Show when={voice.state() !== "READY"}>
            {/* <Button variant="secondary">
              <MdHeadset {...iconSize(20)} />
            </Button> */}

            <div
              use:floating={{
                tooltip: {
                  placement: "top",
                  content: "Coming soon! 👀",
                },
              }}
            >
              <Button onPress={() => voice.toggleCamera()} isDisabled>
                <Switch fallback="Camera">
                  <Match when={voice.video()}>Sharing camera</Match>
                </Switch>
              </Button>
            </div>

            <div
              use:floating={{
                tooltip: {
                  placement: "top",
                  content: "Coming soon! 👀",
                },
              }}
            >
              <Button onPress={() => voice.toggleScreenshare()} isDisabled>
                <Switch fallback="Share screen">
                  <Match when={voice.screenshare()}>Sharing screen</Match>
                </Switch>
              </Button>
            </div>
          </Show>
        </Actions>
      </Row>
    </Column>
  );
}

const Actions = styled("div", {
  base: {
    display: "flex",
    gap: "2",
    padding: "2",
  },
});
