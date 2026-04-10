import { Trans, useLingui } from "@lingui-solid/solid/macro";

import { Language, Languages, browserPreferredLanguage } from "@revolt/i18n";
import type { LanguageEntry } from "@revolt/i18n/Languages";
import { timeLocale } from "@revolt/i18n/dayjs";
import { UnicodeEmoji } from "@revolt/markdown/emoji";
import { useState } from "@revolt/state";
import {
  CategoryButton,
  CategorySelectOption,
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
      <CategoryButton.Group>
        <PickLanguage />
        {/* <ConfigureRTL /> */}
      </CategoryButton.Group>
      <CategoryButton.Group>
        <PickDateFormat />
        <PickTimeFormat />
      </CategoryButton.Group>
      <CategoryButton.Group>
        <ContributeLanguageLink />
      </CategoryButton.Group>
    </Column>
  );
}

const RE_LANG = /_/g;

/**
 * Pick user's preferred language
 */
function PickLanguage() {
  const { locale } = useState();
  const { i18n } = useLingui();

  //@ts-expect-error unfilled object
  const langOpts: { [k in Language]: CategorySelectOption } = {};
  const langIds = Object.keys(Languages) as Language[];

  //Move user's system language to top
  //TODO: Make browserPreferredLanguage() reactive, then make langOpts a memo
  const prefLang = browserPreferredLanguage();
  if (prefLang) {
    const prefIdx = langIds.findIndex(
      (id) => id.replace(RE_LANG, "-") === prefLang,
    );
    if (prefIdx !== -1) langIds.unshift(langIds.splice(prefIdx, 1)[0]);
  }

  //Generate language dict
  let id: Language, lang: LanguageEntry;
  for (id of langIds) {
    lang = Languages[id];
    langOpts[id] = {
      title: (
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
      ),
      shortDesc: lang.display,
      icon: <UnicodeEmoji emoji={lang.emoji} />,
    };
  }

  return (
    <CategoryButton.Select
      icon={<MdLanguage {...iconSize(22)} />}
      title={<Trans>Select your language</Trans>}
      value={i18n().locale as Language}
      options={langOpts}
      onUpdate={(id) => locale.switch(id)}
    />
  );
}

/**
 * Pick user's preferred date format
 */
function PickDateFormat() {
  const { locale } = useState();
  const LastWeek = new Date();
  LastWeek.setDate(LastWeek.getDate() - 7);

  return (
    <CategoryButton.Select
      icon={<MdCalendarMonth {...iconSize(22)} />}
      title={<Trans>Date format</Trans>}
      value={timeLocale()[1].formats.L}
      options={{
        "DD/MM/YYYY": {
          shortDesc: <Trans>Traditional (DD/MM/YYYY)</Trans>,
          description: <Time format="date" value={LastWeek} />,
        },
        "MM/DD/YYYY": {
          shortDesc: <Trans>American (MM/DD/YYYY)</Trans>,
          description: <Time format="dateAmerican" value={LastWeek} />,
        },
        "YYYY-MM-DD": {
          shortDesc: <Trans>ISO Standard (YYYY-MM-DD)</Trans>,
          description: <Time format="iso8601" value={LastWeek} />,
        },
      }}
      onUpdate={(f) => locale.setDateFormat(f)}
    />
  );
}

/**
 * Pick user's preferred time format
 */
function PickTimeFormat() {
  const { locale } = useState();

  return (
    <CategoryButton.Select
      icon={<MdSchedule {...iconSize(22)} />}
      title={<Trans>Time format</Trans>}
      value={timeLocale()[1].formats.LT}
      options={{
        "HH:mm": {
          shortDesc: <Trans>24 hours</Trans>,
          description: <Time format="time24" value={new Date()} />,
        },
        "h:mm A": {
          shortDesc: <Trans>12 hours</Trans>,
          description: <Time format="time12" value={new Date()} />,
        },
      }}
      onUpdate={(f) => locale.setTimeFormat(f)}
    />
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
