import { createFormControl, createFormGroup } from "solid-forms";
import { Show, createEffect, createSignal, on } from "solid-js";

import { Trans, useLingui } from "@lingui-solid/solid/macro";
import { useQuery } from "@tanstack/solid-query";
import { API, User } from "stoat.js";

import { useClient } from "@revolt/client";
import { CONFIGURATION } from "@revolt/common";
import {
  CategoryButton,
  CircularProgress,
  Column,
  Form2,
  Row,
  Text,
} from "@revolt/ui";

import MdBadge from "@material-design-icons/svg/filled/badge.svg?component-solid";

import { useSettingsNavigation } from "../../Settings";

interface Props {
  user: User;
}

export function UserProfileEditor(props: Props) {
  const { t } = useLingui();
  const client = useClient();

  const profile = useQuery(() => ({
    queryKey: ["profile", props.user.id],
    queryFn: () => props.user.fetchProfile(),
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  }));

  const { navigate } = useSettingsNavigation();

  /* eslint-disable solid/reactivity */
  const editGroup = createFormGroup({
    displayName: createFormControl(props.user.displayName),
    // username: createFormControl(props.user.username),
    avatar: createFormControl<string | File[] | null>(
      props.user.animatedAvatarURL,
    ),
    banner: createFormControl<string | File[] | null>(null),
    bio: createFormControl(""),
  });
  /* eslint-enable solid/reactivity */

  // unlike the other forms, this one does not react to
  // further changes outside of our control because it's
  // unlikely that the user is going to be doing this

  const [initialBio, setInitialBio] = createSignal<readonly [string]>();

  // once profile data is loaded, copy it into the form
  createEffect(
    on(
      () => profile.data,
      (profileData) => {
        if (profileData) {
          editGroup.controls.banner.setValue(
            profileData.animatedBannerURL || null,
          );

          editGroup.controls.bio.setValue(profileData.content || "");
          setInitialBio([profileData.content || ""]);
        }
      },
    ),
  );

  function onReset() {
    editGroup.controls.displayName.setValue(props.user.displayName);
    // editGroup.controls.username.setValue(props.user.username);
    editGroup.controls.avatar.setValue(props.user.animatedAvatarURL);

    if (profile.data) {
      editGroup.controls.banner.setValue(
        profile.data.animatedBannerURL || null,
      );

      editGroup.controls.bio.setValue(profile.data.content || "");
      setInitialBio([profile.data.content || ""]);
    }
  }

  async function onSubmit() {
    const changes: API.DataEditUser = {
      remove: [],
    };

    // if (editGroup.controls.username.isDirty) {
    //   changes.
    // }

    if (editGroup.controls.displayName.isDirty) {
      changes.display_name = editGroup.controls.displayName.value.trim();
    }

    if (editGroup.controls.avatar.isDirty) {
      if (!editGroup.controls.avatar.value) {
        changes.remove!.push("Avatar");
      } else if (Array.isArray(editGroup.controls.avatar.value)) {
        changes.avatar = await client().uploadFile(
          "avatars",
          editGroup.controls.avatar.value[0],
          CONFIGURATION.DEFAULT_MEDIA_URL,
        );
      }
    }

    if (editGroup.controls.bio.isDirty) {
      if (!editGroup.controls.bio.value) {
        changes.remove!.push("ProfileContent");
      } else {
        changes.profile ??= {};
        changes.profile.content = editGroup.controls.bio.value;
      }
    }

    if (editGroup.controls.banner.isDirty) {
      if (!editGroup.controls.banner.value) {
        changes.remove!.push("ProfileBackground");
      } else if (Array.isArray(editGroup.controls.banner.value)) {
        changes.profile ??= {};
        changes.profile.background = await client().uploadFile(
          "backgrounds",
          editGroup.controls.banner.value[0],
          CONFIGURATION.DEFAULT_MEDIA_URL,
        );
      }
    }

    await props.user.edit(changes);
  }

  return (
    <form onSubmit={Form2.submitHandler(editGroup, onSubmit, onReset)}>
      <Column>
        <Form2.FileInput
          control={editGroup.controls.avatar}
          accept="image/*"
          label={t`Avatar`}
          imageJustify={false}
        />
        <Form2.FileInput
          control={editGroup.controls.banner}
          accept="image/*"
          label={t`Banner`}
          imageAspect="232/100"
          imageRounded={false}
          imageJustify={false}
        />
        <Form2.TextField
          name="displayName"
          control={editGroup.controls.displayName}
          label={t`Display Name`}
        />

        <Show when={!props.user.bot}>
          <CategoryButton
            icon={<MdBadge />}
            action="chevron"
            description={
              <Trans>Go to account settings to edit your username</Trans>
            }
            onClick={() => navigate("account")}
          >
            <Trans>Want to change username?</Trans>
          </CategoryButton>
        </Show>

        <Text class="label">
          <Trans>Profile Bio</Trans>
        </Text>
        <Form2.TextEditor
          initialValue={initialBio()}
          control={editGroup.controls.bio}
          placeholder={t`Something cool about me...`}
        />

        <Row>
          <Form2.Reset group={editGroup} onReset={onReset} />
          <Form2.Submit group={editGroup} requireDirty>
            <Trans>Save</Trans>
          </Form2.Submit>
          <Show when={editGroup.isPending}>
            <CircularProgress />
          </Show>
        </Row>
      </Column>
    </form>
  );
}
