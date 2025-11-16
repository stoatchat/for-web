import { For, createMemo } from "solid-js";

import { Trans, useLingui } from "@lingui-solid/solid/macro";

import { Language, Languages, browserPreferredLanguage } from "@revolt/i18n";
import type { LanguageEntry } from "@revolt/i18n/Languages";
import { timeLocale } from "@revolt/i18n/dayjs";
import { UnicodeEmoji } from "@revolt/markdown/emoji";
import { useState } from "@revolt/state";
import {
  CategoryButton,
  CategoryButtonGroup,
  CategoryCollapse,
  Checkbox,
  Column,
  Row,
  Time,
  iconSize,
} from "@revolt/ui";

import MdErrorFill from "@material-design-icons/svg/filled/error.svg?component-solid";
import MdVerifiedFill from "@material-design-icons/svg/filled/verified.svg?component-solid";
import MdCalendarMonth from "@material-design-icons/svg/outlined/calendar_month.svg?component-solid";
import MdLanguage from "@material-design-icons/svg/outlined/language.svg?component-solid";
import MdSchedule from "@material-design-icons/svg/outlined/schedule.svg?component-solid";
import MdTranslate from "@material-design-icons/svg/outlined/translate.svg?component-solid";

/**
 * Language
 */
export function LanguageSettings() {
  return (
    <Column gap="lg">
      <CategoryButtonGroup>
        <PickLanguage />
        {/* <ConfigureRTL /> */}
      </CategoryButtonGroup>
      <CategoryButtonGroup>
        <PickDateFormat />
        <PickTimeFormat />
      </CategoryButtonGroup>
      <CategoryButtonGroup>
        <ContributeLanguageLink />
      </CategoryButtonGroup>
    </Column>
  );
}

/**
 * Pick user's preferred language
 */
function PickLanguage() {
  const state = useState();
  const { i18n } = useLingui();

  /**
   * Determine the current language
   */
  const currentLanguage = () =>
    Languages[i18n().locale as never] as LanguageEntry;

  // Generate languages array.
  const languages = createMemo(() => {
    const languages = Object.keys(Languages).map(
      (x) => [x, Languages[x as keyof typeof Languages]] as const,
    );

    const preferredLanguage = browserPreferredLanguage();

    if (preferredLanguage) {
      // This moves the user's system language to the top of the language list
      const prefLangKey = languages.find(
        (lang) => lang[0].replace(/_/g, "-") == preferredLanguage,
      );

      if (prefLangKey) {
        languages.splice(
          0,
          0,
          languages.splice(languages.indexOf(prefLangKey), 1)[0],
        );
      }
    }

    return languages;
  });

  return (
    <CategoryCollapse
      icon={<MdLanguage {...iconSize(22)} />}
      title={<Trans>Select your language</Trans>}
      description={currentLanguage().display}
      scrollable
    >
      <For each={languages()}>
        {([id, lang]) => (
          <CategoryButton
            icon={<UnicodeEmoji emoji={lang.emoji} />}
            action={<Checkbox checked={id === i18n().locale} />}
            onClick={() => state.locale.switch(id as Language)}
          >
            <Row>
              {lang.display}{" "}
              {lang.verified && (
                <MdVerifiedFill
                  {...iconSize(18)}
                  fill="var(--md-sys-color-on-surface)"
                />
              )}{" "}
              {lang.incomplete && (
                <MdErrorFill
                  {...iconSize(18)}
                  fill="var(--md-sys-color-on-surface)"
                />
              )}
            </Row>
          </CategoryButton>
        )}
      </For>
    </CategoryCollapse>
  );
}

/**
 * Pick user's preferred date format
 */
function PickDateFormat() {
  const state = useState();
  const { t } = useLingui();
  const date = () => timeLocale()[1].formats.L;

  const LastWeek = new Date();
  LastWeek.setDate(LastWeek.getDate() - 7);

  return (
    <CategoryCollapse
      icon={<MdCalendarMonth {...iconSize(22)} />}
      title="Select date format"
      description={
        date() === "DD/MM/YYYY"
          ? t`Traditional (DD/MM/YYYY)`
          : date() === "MM/DD/YYYY"
            ? t`American (MM/DD/YYYY)`
            : date() === "YYYY-MM-DD"
              ? t`ISO Standard (YYYY-MM-DD)`
              : date()
      }
    >
      <CategoryButton
        icon={"blank"}
        onClick={() => state.locale.setDateFormat("DD/MM/YYYY")}
        action={<Checkbox checked={date() === "DD/MM/YYYY"} />}
        description={<Time format="date" value={LastWeek} />}
      >
        <Trans>Traditional (DD/MM/YYYY)</Trans>
      </CategoryButton>
      <CategoryButton
        icon={"blank"}
        onClick={() => state.locale.setDateFormat("MM/DD/YYYY")}
        action={<Checkbox checked={date() === "MM/DD/YYYY"} />}
        description={<Time format="dateAmerican" value={LastWeek} />}
      >
        <Trans>American (MM/DD/YYYY)</Trans>
      </CategoryButton>
      <CategoryButton
        icon={"blank"}
        onClick={() => state.locale.setDateFormat("YYYY-MM-DD")}
        action={<Checkbox checked={date() === "YYYY-MM-DD"} />}
        description={<Time format="iso8601" value={LastWeek} />}
      >
        <Trans>ISO Standard (YYYY-MM-DD)</Trans>
      </CategoryButton>
    </CategoryCollapse>
  );
}

/**
 * Pick user's preferred time format
 */
function PickTimeFormat() {
  const state = useState();
  const { t } = useLingui();
  const time = () => timeLocale()[1].formats.LT;

  return (
    <CategoryCollapse
      icon={<MdSchedule {...iconSize(22)} />}
      title="Select time format"
      description={time() === "HH:mm" ? t`24 hours` : t`12 hours`}
    >
      <CategoryButton
        icon={"blank"}
        onClick={() => state.locale.setTimeFormat("HH:mm")}
        action={<Checkbox checked={time() === "HH:mm"} />}
        description={<Time format="time24" value={new Date()} />}
      >
        <Trans>24 hours</Trans>
      </CategoryButton>
      <CategoryButton
        icon={"blank"}
        onClick={() => state.locale.setTimeFormat("h:mm A")}
        action={<Checkbox checked={time() === "h:mm A"} />}
        description={<Time format="time12" value={new Date()} />}
      >
        <Trans>12 hours</Trans>
      </CategoryButton>
    </CategoryCollapse>
  );
}

// /**
//  * Configure right-to-left display
//  */
// function ConfigureRTL() {
//   /**
//    * Determine the current language
//    */
//   const currentLanguage = () => Languages[language()];

//   return (
//     <Switch
//       fallback={
//         <CategoryButton
//           icon={<MdKeyboardTabRtl {...iconSize(22)} />}
//           description={<Trans>Flip the user interface right to left</Trans>}
//           action={<Checkbox />}
//           onClick={() => void 0}
//         >
//           <Trans>Enable RTL layout</Trans>
//         </CategoryButton>
//       }
//     >
//       <Match when={currentLanguage().rtl}>
//         <CategoryButton
//           icon={<MdKeyboardTab {...iconSize(22)} />}
//           description={<Trans>Keep the user interface left to right</Trans>}
//           action={<Checkbox />}
//           onClick={() => void 0}
//         >
//           <Trans>Force LTR layout</Trans>
//         </CategoryButton>
//       </Match>
//     </Switch>
//   );
// }

/**
 * Language contribution link
 */
function ContributeLanguageLink() {
  return (
    <a href="https://weblate.insrt.uk/engage/revolt/" target="_blank">
      <CategoryButton
        action="external"
        icon={<MdTranslate {...iconSize(22)} />}
        onClick={() => void 0}
        description={
          <Trans>Help contribute to an existing or new language</Trans>
        }
      >
        <Trans>Contribute a language</Trans>
      </CategoryButton>
    </a>
  );
}
