import { Trans } from "@lingui-solid/solid/macro";
import { Show } from "solid-js";

import { useSound } from "@revolt/client";
import { useState } from "@revolt/state";
import {
  CategoryButton,
  Checkbox,
  Column,
  IconButton,
  Text,
  iconSize,
} from "@revolt/ui";

import MdVolumeUp from "@material-design-icons/svg/outlined/volume_up.svg?component-solid";

export default function Sounds() {
  const { settings, sounds } = useState();
  const soundController = useSound();

  return (
    <Show when={settings.desktopNotificationsState !== "unsupported"}>
      <Column>
        <Text class="title">
          <Trans>Sounds</Trans>
        </Text>
        <CategoryButton.Group>
          <CategoryButton
            action={<Checkbox checked={sounds.enabled("message")} />}
            onClick={() => sounds.toggle("message")}
            icon={
              <IconButton
                onPress={() => soundController.playSound("message", true)}
              >
                <MdVolumeUp {...iconSize(22)} />
              </IconButton>
            }
          >
            <Trans>Message Received</Trans>
          </CategoryButton>
          <CategoryButton
            action={<Checkbox checked={sounds.enabled("mute")} />}
            onClick={() => sounds.toggle("mute")}
            icon={
              <IconButton
                onPress={() => soundController.playSound("mute", true)}
              >
                <MdVolumeUp {...iconSize(22)} />
              </IconButton>
            }
          >
            <Trans>Mute</Trans>
          </CategoryButton>
          <CategoryButton
            action={<Checkbox checked={sounds.enabled("unmute")} />}
            onClick={() => sounds.toggle("unmute")}
            icon={
              <IconButton
                onPress={() => soundController.playSound("unmute", true)}
              >
                <MdVolumeUp {...iconSize(22)} />
              </IconButton>
            }
          >
            <Trans>Unmute</Trans>
          </CategoryButton>
          <CategoryButton
            action={<Checkbox checked={sounds.enabled("deafen")} />}
            onClick={() => sounds.toggle("deafen")}
            icon={
              <IconButton
                onPress={() => soundController.playSound("deafen", true)}
              >
                <MdVolumeUp {...iconSize(22)} />
              </IconButton>
            }
          >
            <Trans>Deafen</Trans>
          </CategoryButton>
          <CategoryButton
            action={<Checkbox checked={sounds.enabled("undeafen")} />}
            onClick={() => sounds.toggle("undeafen")}
            icon={
              <IconButton
                onPress={() => soundController.playSound("undeafen", true)}
              >
                <MdVolumeUp {...iconSize(22)} />
              </IconButton>
            }
          >
            <Trans>Undeafen</Trans>
          </CategoryButton>
          {/* I don't think we need this? */}
          <Show when={false}>
            <CategoryButton
              action={<Checkbox onChange={(value) => void value} />}
              onClick={() => void 0}
              icon="blank"
            >
              <Trans>Message Sent</Trans>
            </CategoryButton>
          </Show>
          <CategoryButton
            action={<Checkbox checked={sounds.enabled("userJoinVoice")} />}
            onClick={() => sounds.toggle("userJoinVoice")}
            icon={
              <IconButton
                onPress={() => soundController.playSound("userJoinVoice", true)}
              >
                <MdVolumeUp {...iconSize(22)} />
              </IconButton>
            }
          >
            <Trans>User Joined Call</Trans>
          </CategoryButton>
          <CategoryButton
            action={<Checkbox checked={sounds.enabled("userLeaveVoice")} />}
            onClick={() => sounds.toggle("userLeaveVoice")}
            icon={
              <IconButton
                onPress={() =>
                  soundController.playSound("userLeaveVoice", true)
                }
              >
                <MdVolumeUp {...iconSize(22)} />
              </IconButton>
            }
          >
            <Trans>User Left Call</Trans>
          </CategoryButton>
          <CategoryButton
            action={<Checkbox checked={sounds.enabled("streamStart")} />}
            onClick={() => sounds.toggle("streamStart")}
            icon={
              <IconButton
                onPress={() => soundController.playSound("streamStart", true)}
              >
                <MdVolumeUp {...iconSize(22)} />
              </IconButton>
            }
          >
            <Trans>Stream Start</Trans>
          </CategoryButton>
          <CategoryButton
            action={<Checkbox checked={sounds.enabled("streamEnd")} />}
            onClick={() => sounds.toggle("streamEnd")}
            icon={
              <IconButton
                onPress={() => soundController.playSound("streamEnd", true)}
              >
                <MdVolumeUp {...iconSize(22)} />
              </IconButton>
            }
          >
            <Trans>Stream End</Trans>
          </CategoryButton>
        </CategoryButton.Group>
      </Column>
    </Show>
  );
}
