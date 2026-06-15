import { Trans, useLingui } from "@lingui-solid/solid/macro";
import { Show } from "solid-js";
import { styled } from "styled-system/jsx";

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
  const { t } = useLingui();

  const playSoundString = t`Play sound`;

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
            icon="blank"
          >
            <Content>
              <Trans>Message Received</Trans>{" "}
              <IconButton
                onPress={() => soundController.playSound("message", true)}
                use:floating={{
                  tooltip: {
                    placement: "top",
                    content: playSoundString,
                  },
                }}
              >
                <MdVolumeUp {...iconSize(18)} />
              </IconButton>
            </Content>
          </CategoryButton>
          <CategoryButton
            action={<Checkbox checked={sounds.enabled("mute")} />}
            onClick={() => sounds.toggle("mute")}
            icon="blank"
          >
            <Content>
              <Trans>Mute</Trans>
              <IconButton
                onPress={() => soundController.playSound("mute", true)}
                use:floating={{
                  tooltip: {
                    placement: "top",
                    content: playSoundString,
                  },
                }}
              >
                <MdVolumeUp {...iconSize(18)} />
              </IconButton>
            </Content>
          </CategoryButton>
          <CategoryButton
            action={<Checkbox checked={sounds.enabled("unmute")} />}
            onClick={() => sounds.toggle("unmute")}
            icon="blank"
          >
            <Content>
              <Trans>Unmute</Trans>
              <IconButton
                onPress={() => soundController.playSound("unmute", true)}
                use:floating={{
                  tooltip: {
                    placement: "top",
                    content: playSoundString,
                  },
                }}
              >
                <MdVolumeUp {...iconSize(18)} />
              </IconButton>
            </Content>
          </CategoryButton>
          <CategoryButton
            action={<Checkbox checked={sounds.enabled("deafen")} />}
            onClick={() => sounds.toggle("deafen")}
            icon="blank"
          >
            <Content>
              <Trans>Deafen</Trans>
              <IconButton
                onPress={() => soundController.playSound("deafen", true)}
                use:floating={{
                  tooltip: {
                    placement: "top",
                    content: playSoundString,
                  },
                }}
              >
                <MdVolumeUp {...iconSize(18)} />
              </IconButton>
            </Content>
          </CategoryButton>
          <CategoryButton
            action={<Checkbox checked={sounds.enabled("undeafen")} />}
            onClick={() => sounds.toggle("undeafen")}
            icon="blank"
          >
            <Content>
              <Trans>Undeafen</Trans>
              <IconButton
                onPress={() => soundController.playSound("undeafen", true)}
                use:floating={{
                  tooltip: {
                    placement: "top",
                    content: playSoundString,
                  },
                }}
              >
                <MdVolumeUp {...iconSize(18)} />
              </IconButton>
            </Content>
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
            icon="blank"
          >
            <Content>
              <Trans>User Joined Call</Trans>
              <IconButton
                onPress={() => soundController.playSound("userJoinVoice", true)}
                use:floating={{
                  tooltip: {
                    placement: "top",
                    content: playSoundString,
                  },
                }}
              >
                <MdVolumeUp {...iconSize(18)} />
              </IconButton>
            </Content>
          </CategoryButton>
          <CategoryButton
            action={<Checkbox checked={sounds.enabled("userLeaveVoice")} />}
            onClick={() => sounds.toggle("userLeaveVoice")}
            icon="blank"
          >
            <Content>
              <Trans>User Left Call</Trans>
              <IconButton
                onPress={() =>
                  soundController.playSound("userLeaveVoice", true)
                }
                use:floating={{
                  tooltip: {
                    placement: "top",
                    content: playSoundString,
                  },
                }}
              >
                <MdVolumeUp {...iconSize(18)} />
              </IconButton>
            </Content>
          </CategoryButton>
          <CategoryButton
            action={<Checkbox checked={sounds.enabled("streamStart")} />}
            onClick={() => sounds.toggle("streamStart")}
            icon="blank"
          >
            <Content>
              <Trans>Stream Start</Trans>
              <IconButton
                onPress={() => soundController.playSound("streamStart", true)}
                use:floating={{
                  tooltip: {
                    placement: "top",
                    content: playSoundString,
                  },
                }}
              >
                <MdVolumeUp {...iconSize(18)} />
              </IconButton>
            </Content>
          </CategoryButton>
          <CategoryButton
            action={<Checkbox checked={sounds.enabled("streamEnd")} />}
            onClick={() => sounds.toggle("streamEnd")}
            icon="blank"
          >
            <Content>
              <Trans>Stream End</Trans>
              <IconButton
                onPress={() => soundController.playSound("streamEnd", true)}
                use:floating={{
                  tooltip: {
                    placement: "top",
                    content: playSoundString,
                  },
                }}
              >
                <MdVolumeUp {...iconSize(18)} />
              </IconButton>
            </Content>
          </CategoryButton>
        </CategoryButton.Group>
      </Column>
    </Show>
  );
}

/**
 * Sound content wrapper
 */
const Content = styled("div", {
  base: {
    display: "flex",
    flexGrow: 1,
    flexDirection: "row",
    alignItems: "center",
  },
});
