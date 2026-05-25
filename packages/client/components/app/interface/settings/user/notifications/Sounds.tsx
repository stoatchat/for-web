import { Trans } from "@lingui-solid/solid/macro";
import { useState } from "@revolt/state";
import { CategoryButton, Checkbox, Column, Text } from "@revolt/ui";
import { Show } from "solid-js";

export default function Sounds() {
  const { settings, sounds } = useState();

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
            <Trans>Message Received</Trans>
          </CategoryButton>
          <CategoryButton
            action={<Checkbox checked={sounds.enabled("mute")} />}
            onClick={() => sounds.toggle("mute")}
            icon="blank"
          >
            <Trans>Mute</Trans>
          </CategoryButton>
          <CategoryButton
            action={<Checkbox checked={sounds.enabled("unmute")} />}
            onClick={() => sounds.toggle("unmute")}
            icon="blank"
          >
            <Trans>Unmute</Trans>
          </CategoryButton>
          <CategoryButton
            action={<Checkbox checked={sounds.enabled("deafen")} />}
            onClick={() => sounds.toggle("deafen")}
            icon="blank"
          >
            <Trans>Deafen</Trans>
          </CategoryButton>
          <CategoryButton
            action={<Checkbox checked={sounds.enabled("undeafen")} />}
            onClick={() => sounds.toggle("undeafen")}
            icon="blank"
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
            icon="blank"
          >
            <Trans>User Joined Call</Trans>
          </CategoryButton>
          <CategoryButton
            action={<Checkbox checked={sounds.enabled("userLeaveVoice")} />}
            onClick={() => sounds.toggle("userLeaveVoice")}
            icon="blank"
          >
            <Trans>User Left Call</Trans>
          </CategoryButton>
          <CategoryButton
            action={<Checkbox checked={sounds.enabled("streamStart")} />}
            onClick={() => sounds.toggle("streamStart")}
            icon="blank"
          >
            <Trans>Stream Start</Trans>
          </CategoryButton>
          <CategoryButton
            action={<Checkbox checked={sounds.enabled("streamEnd")} />}
            onClick={() => sounds.toggle("streamEnd")}
            icon="blank"
          >
            <Trans>Stream End</Trans>
          </CategoryButton>
        </CategoryButton.Group>
      </Column>
    </Show>
  );
}
