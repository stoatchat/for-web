/* eslint-disable */
import { createFormControl, createFormGroup } from "solid-forms";
import { BiSolidPalette, BiSolidSpeaker } from "solid-icons/bi";
import { For } from "solid-js";

import { PublicBot, PublicChannelInvite } from "stoat.js";
import { cva } from "styled-system/css";
import { styled } from "styled-system/jsx";

import { useClient } from "@revolt/client";
import { useModals } from "@revolt/modal";
import {
  Button,
  CategoryButton,
  CategoryCollapse,
  Column,
  ComboBox,
  DataTable,
  Form2,
  IconButton,
  OverrideSwitch,
  Row,
  Text,
  TextField,
  iconSize,
} from "@revolt/ui";

import Face from "@material-design-icons/svg/filled/face.svg?component-solid";

const NewComponent = styled("div", {
  base: {
    background: "blue",
    color: "white",
  },
});

const newComponent = cva({
  base: {
    background: "blue",
    color: "white",
  },
});

function FormTest() {
  const group = createFormGroup({
    name: createFormControl(""),
    email: createFormControl("", {
      // required: true,
      validators: (value: string) =>
        value.length <= 15 ? { isMissing: true } : null,
    }),
  });

  const onSubmit = async () => {
    console.info(group.data);
  };

  return (
    <form onSubmit={Form2.submitHandler(group, onSubmit)}>
      <label for="name">Your name</label>
      <Form2.TextField name="name" control={group.controls.name} />

      <label for="email">Your email address</label>
      <Form2.TextField
        name="email"
        type="email"
        control={group.controls.email}
      />

      <button>Submit</button>
    </form>
  );
}

export function DevelopmentPage() {
  const client = useClient();
  const { openModal } = useModals();

  function open() {
    openModal({
      type: "channel_toggle_mature",
      channel: client().channels.find((x) => x.name === "Empty Test Channel")!,
      // type: "custom_status",
      // client: clientController.getCurrentClient()!,
    });
  }

  function changelog() {
    openModal({
      type: "changelog",
      posts: [
        {
          date: new Date("2022-06-12T20:39:16.674Z"),
          title: "Secure your account with 2FA",
          content: [
            "Two-factor authentication is now available to all users, you can now head over to settings to enable recovery codes and an authenticator app.",
            {
              type: "image",
              src: "https://autumn.revolt.chat/attachments/E21kwmuJGcASgkVLiSIW0wV3ggcaOWjW0TQF7cdFNY/image.png",
            },
            "Once enabled, you will be prompted on login.",
            {
              type: "image",
              src: "https://autumn.revolt.chat/attachments/LWRYoKR2tE1ggW_Lzm547P1pnrkNgmBaoCAfWvHE74/image.png",
            },
            "Other authentication methods coming later, stay tuned!",
          ],
        },
      ],
    });
  }

  const manyData = new Array(1000).fill(0).map((_, idx) => idx);

  return (
    <Column>
      <Button
        onPress={() => {
          client()
            .api.get("/invites/Testers")
            .then((invite) => PublicChannelInvite.from(client(), invite))
            .then((invite) => openModal({ type: "invite", invite }));
        }}
      >
        invite test
      </Button>
      <Button
        onPress={() => {
          client()
            .api.get("/bots/01FHGJ3NPP7XANQQH8C2BE44ZY/invite")
            .then((bot) => new PublicBot(client(), bot))
            .then((bot) => openModal({ type: "add_bot", invite: bot }));
        }}
      >
        bot test
      </Button>

      <Button onPress={changelog}>Changelog Modal</Button>

      <Row align>
        <Button variant="elevated">Elevated</Button>
        <Button variant="filled">Filled</Button>
        <Button variant="tonal">Tonal</Button>
        <Button variant="outlined">Outlined</Button>
        <Button variant="text">Text</Button>
      </Row>

      <Row align>
        <IconButton variant="filled">
          <Face />
        </IconButton>
        <IconButton variant="tonal">
          <Face />
        </IconButton>
        <IconButton variant="outlined">
          <Face />
        </IconButton>
        <IconButton variant="standard">
          <Face />
        </IconButton>
      </Row>
      <Row align>
        <IconButton size="xs" shape="square">
          <Face />
        </IconButton>
        <IconButton size="sm" shape="square">
          <Face />
        </IconButton>
        <IconButton size="md" shape="square">
          <Face />
        </IconButton>
        <IconButton size="lg" shape="square">
          <Face />
        </IconButton>
        <IconButton size="xl" shape="square">
          <Face />
        </IconButton>
      </Row>

      <DataTable
        header={<Text class="title">Table Title</Text>}
        columns={["idx", "hello", "2"]}
        itemCount={manyData.length}
      >
        {(page, itemsPerPage) => (
          <For
            each={manyData.slice(
              page * itemsPerPage,
              page * itemsPerPage + itemsPerPage,
            )}
          >
            {(item) => (
              <DataTable.Row>
                <DataTable.Cell>{item}</DataTable.Cell>
                <DataTable.Cell>rahh</DataTable.Cell>
                <DataTable.Cell>123</DataTable.Cell>
              </DataTable.Row>
            )}
          </For>
        )}
      </DataTable>

      <FormTest />

      <div
        style={{
          width: "480px",
          height: "480px",
          display: "grid",
          "place-items": "center",
        }}
      >
        <Face fill="red" {...iconSize(128)} />
      </div>

      <TextField
        variant="outlined"
        label="Outlined Input"
        placeholder="Type here :D"
      />

      <TextField
        variant="filled"
        label="Filled Input"
        placeholder="Type here :D"
      />

      <div
        // have to wrap the component in something that can receive a directive
        use:floating={{ tooltip: { content: "hello", placement: "bottom" } }}
      >
        <NewComponent>hello, but im from panda-css</NewComponent>
      </div>

      <div
        class={newComponent()}
        use:floating={{ tooltip: { content: "hello", placement: "bottom" } }}
      >
        best of both worlds?
      </div>

      <Button onPress={open}>Open Modal</Button>
      <Button
        use:floating={{ tooltip: { content: "hi", placement: "bottom" } }}
      >
        I'm a button with a tooltip!
      </Button>
      <div style={{ padding: "1em", width: "400px" }}>
        <Column>
          <CategoryButton
            icon={<BiSolidPalette size={24} />}
            description="description!"
            onClick={() => void 0}
          >
            I am a button
          </CategoryButton>
          <CategoryCollapse
            icon={<BiSolidSpeaker size={24} />}
            description="description!"
            title="Choose output device tbh"
          >
            <CategoryButton
              description="Active device"
              onClick={() => void 0}
              icon={<div style={{ width: "24px" }} />}
            >
              Realtek Audio
            </CategoryButton>
            <CategoryButton
              onClick={() => void 0}
              icon={<div style={{ width: "24px" }} />}
            >
              Line-Out Speaker
            </CategoryButton>
            <CategoryButton
              onClick={() => void 0}
              icon={<div style={{ width: "24px" }} />}
            >
              Airpods 3
            </CategoryButton>
            <CategoryButton
              icon={<div style={{ width: "24px" }} />}
              action={
                <ComboBox>
                  <option>deez</option>
                </ComboBox>
              }
            >
              combo box
            </CategoryButton>
          </CategoryCollapse>
        </Column>
      </div>
    </Column>
  );
}
