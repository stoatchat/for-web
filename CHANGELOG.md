# Changelog

## [0.3.0](https://github.com/stoatchat/for-web/compare/stoat-for-web-v0.2.1...stoat-for-web-v0.3.0) (2026-03-03)


### Features

* add button to rename categories ([#633](https://github.com/stoatchat/for-web/issues/633)) ([c3042a0](https://github.com/stoatchat/for-web/commit/c3042a094e4159705b176e4d312d9018cdcb97bb))
* add delete bot button back to ViewBot component ([#808](https://github.com/stoatchat/for-web/issues/808)) ([64fd6af](https://github.com/stoatchat/for-web/commit/64fd6af7b7e2aeea76bc564025062ce73bef93e9))
* add support for all possible languages for codeblock syntax highlighting ([#796](https://github.com/stoatchat/for-web/issues/796)) ([fd373b2](https://github.com/stoatchat/for-web/commit/fd373b219beb149c9df776adbaff79180733d172))
* Adds a Docker Build for the Web Client ([#697](https://github.com/stoatchat/for-web/issues/697)) ([6c5970f](https://github.com/stoatchat/for-web/commit/6c5970f9865b3bfb5cdbcfceb99676f1a40cc3b8))
* Enable video with an env var ([#847](https://github.com/stoatchat/for-web/issues/847)) ([928e898](https://github.com/stoatchat/for-web/commit/928e898bc16446dcbe50f720541fd5983fc80d91))
* make gifbox URL configurable via VITE_GIFBOX_URL env var ([#695](https://github.com/stoatchat/for-web/issues/695)) ([eeca7c9](https://github.com/stoatchat/for-web/commit/eeca7c903d3152a4dc176f652e52d89ce9763e36))
* start Stoat in tray on startup ([#802](https://github.com/stoatchat/for-web/issues/802)) ([cd1497b](https://github.com/stoatchat/for-web/commit/cd1497b76d8221d55cf57fd04845f940477913a5))


### Bug Fixes

* Docker Build for AMD64 ([#838](https://github.com/stoatchat/for-web/issues/838)) ([addb6b7](https://github.com/stoatchat/for-web/commit/addb6b7c84bf3852691f3311470e714bbe9b5522))
* give message box a maximum height ([#762](https://github.com/stoatchat/for-web/issues/762)) ([f015b12](https://github.com/stoatchat/for-web/commit/f015b12d4a8cb0b2414a137ae874d9c45f4e7ebf))
* hidden drop down when in dialog ([#819](https://github.com/stoatchat/for-web/issues/819)) ([af84fe1](https://github.com/stoatchat/for-web/commit/af84fe175450e61fc0ef60a81808a0a7813074cf))
* ignore deleted role IDs ([#777](https://github.com/stoatchat/for-web/issues/777)) ([57e9ff5](https://github.com/stoatchat/for-web/commit/57e9ff5fa16a863021d6a44d0a538b970cc3b93a))
* incorrect i18n strings causing client lockup ([d07af16](https://github.com/stoatchat/for-web/commit/d07af166e4ff0a67afe1b52b9a39828cb7193580))
* incorrect language format locking up app when blocked user types in chat ([#948](https://github.com/stoatchat/for-web/issues/948)) ([d07af16](https://github.com/stoatchat/for-web/commit/d07af166e4ff0a67afe1b52b9a39828cb7193580))
* Preserve message ID in anchor links ([#714](https://github.com/stoatchat/for-web/issues/714)) ([4ad6990](https://github.com/stoatchat/for-web/commit/4ad69901e7cfca355d08c042ef52960fe5fe6cd1))
* remove version date because it is not being updated ([#749](https://github.com/stoatchat/for-web/issues/749)) ([eb9667d](https://github.com/stoatchat/for-web/commit/eb9667dfa1d4db4edc5e3c4f4b3d33a620f5c901))
* Updated README.md to include connecting to official backend ([#751](https://github.com/stoatchat/for-web/issues/751)) ([b7d120c](https://github.com/stoatchat/for-web/commit/b7d120c0978e26924aa628ef9c594c4844556086))
* use correct start path for PWA ([#718](https://github.com/stoatchat/for-web/issues/718)) ([a113e21](https://github.com/stoatchat/for-web/commit/a113e2171224aa1938cd2b37793c43aa10397842))

## [0.2.1](https://github.com/stoatchat/for-web/compare/stoat-for-web-v0.2.0...stoat-for-web-v0.2.1) (2026-02-13)


### Bug Fixes

* hot fix stoat dev server, more explicit errors (for tom 💜) ([#713](https://github.com/stoatchat/for-web/issues/713)) ([213707a](https://github.com/stoatchat/for-web/commit/213707a1f91a911c26956b97dc31cee90bb18b09))
* prioritize masquerade name on displayed username ([#706](https://github.com/stoatchat/for-web/issues/706)) ([8fea866](https://github.com/stoatchat/for-web/commit/8fea866f585ee46d69625504280a13856fd0d7da))

## [0.2.0](https://github.com/stoatchat/for-web/compare/stoat-for-web-v0.1.0...stoat-for-web-v0.2.0) (2026-02-12)


### Features

* create invite button in invite management tab ([#596](https://github.com/stoatchat/for-web/issues/596)) ([0e93bf8](https://github.com/stoatchat/for-web/commit/0e93bf85b2159e63d1b28bc5c15997ee2bcca9fd))
* new stable message list view ([#580](https://github.com/stoatchat/for-web/issues/580)) ([f9cda02](https://github.com/stoatchat/for-web/commit/f9cda02c280a6094a8fd889566c10d1536c6d714))
* save 'next path' if login is required to app ([#611](https://github.com/stoatchat/for-web/issues/611)) ([37e6dd9](https://github.com/stoatchat/for-web/commit/37e6dd965ff78b38abd4c721424d7121303e8cbe))
* stoat branding! ([#688](https://github.com/stoatchat/for-web/issues/688)) ([b3852b9](https://github.com/stoatchat/for-web/commit/b3852b9db72a278f7a9512d87d9295c3e1efe6f8))


### Bug Fixes

* aggressively cull members list (workaround) ([#685](https://github.com/stoatchat/for-web/issues/685)) ([cfbeb7c](https://github.com/stoatchat/for-web/commit/cfbeb7ce4c94f7799168f17aea48bf667f254903))
* always darken background behind invite modal ([#612](https://github.com/stoatchat/for-web/issues/612)) ([8229f1e](https://github.com/stoatchat/for-web/commit/8229f1e80ed2f602fafa4b7cc4acd2e5de4b08a7))
* call removeFriend() on "Cancel friend request" button click ([#623](https://github.com/stoatchat/for-web/issues/623)) ([a9fd6f6](https://github.com/stoatchat/for-web/commit/a9fd6f627efeecb829bd76d235f1529827a7f73b))
* checkboxes doubble toggle, autostart and made toggle logic reusable ([#666](https://github.com/stoatchat/for-web/issues/666)) ([5feb3b0](https://github.com/stoatchat/for-web/commit/5feb3b07a6af47fbc6bcb29539d9d74ef31704ec))
* do not run lingui on release please branches ([#692](https://github.com/stoatchat/for-web/issues/692)) ([9a5ecba](https://github.com/stoatchat/for-web/commit/9a5ecba9236310f2b25bd5dbad0a37c151fdc812))
* don't show legacy redirect on desktop ([#613](https://github.com/stoatchat/for-web/issues/613)) ([46b3e9a](https://github.com/stoatchat/for-web/commit/46b3e9a4ca72bf52debcc925927bd0092b8ca919))
* email field autocomplete not working for some browsers ([#671](https://github.com/stoatchat/for-web/issues/671)) ([f9684e2](https://github.com/stoatchat/for-web/commit/f9684e2d083d1988bf7cb23a0df5552f0c9fffe4))
* prioritize displayname over username on messages ([#595](https://github.com/stoatchat/for-web/issues/595)) ([9ffc252](https://github.com/stoatchat/for-web/commit/9ffc25250f4ec530459bcf21e93a8fbe33b38093))
* reacting to messages when pack is set ([#645](https://github.com/stoatchat/for-web/issues/645)) ([d368a5f](https://github.com/stoatchat/for-web/commit/d368a5f5b85f568eba014cd6397bcda54e4b8f7a))
* use old-admin subdomain instead of legacy-admin ([#637](https://github.com/stoatchat/for-web/issues/637)) ([bfe96e9](https://github.com/stoatchat/for-web/commit/bfe96e9c8be4461db6441899fda6b3bff310be3d))

## [0.1.0](https://github.com/stoatchat/for-web/compare/stoat-for-web-v0.0.14...stoat-for-web-v0.1.0) (2026-01-21)


### Features

* add custom accent picker for appearance ([#535](https://github.com/stoatchat/for-web/issues/535)) ([72ef98b](https://github.com/stoatchat/for-web/commit/72ef98b51f66f2d96f41c8dd52616bd675631062))
* add system message channel config options ([#564](https://github.com/stoatchat/for-web/issues/564)) ([c807475](https://github.com/stoatchat/for-web/commit/c807475a614b3442953d9daabc03be628f84c01b))
* animate profile picture on hover ([#553](https://github.com/stoatchat/for-web/issues/553)) ([8427333](https://github.com/stoatchat/for-web/commit/8427333f54ec7f342b5e4d5e796e06f23dc49de5))


### Bug Fixes

* allow pinning messages in directmessages ([#583](https://github.com/stoatchat/for-web/issues/583)) ([3388af3](https://github.com/stoatchat/for-web/commit/3388af30c3b591f959544666db8efd48fdcaa0d8))
* check m3Variant in theme clean function ([#571](https://github.com/stoatchat/for-web/issues/571)) ([493ebef](https://github.com/stoatchat/for-web/commit/493ebefa0752a683cbe09072719320ccca8c56fb))
* codemirror bounding box not taking full composer height ([#550](https://github.com/stoatchat/for-web/issues/550)) ([96ceca1](https://github.com/stoatchat/for-web/commit/96ceca1d1b1a77b08afb538b276d7e6eda819de7))
* hide server settings cog and hide settings action in ServerInfo modal ([#542](https://github.com/stoatchat/for-web/issues/542)) ([2f7142f](https://github.com/stoatchat/for-web/commit/2f7142fdc126ee5f0a3bb450d490dc4f5b24f8b8))
* make reset token button functional ([#568](https://github.com/stoatchat/for-web/issues/568)) ([08af789](https://github.com/stoatchat/for-web/commit/08af789658c6dbd91e2d595a2140b877b99b931a))
* mention context menu option not appearing ([#567](https://github.com/stoatchat/for-web/issues/567)) ([81160f4](https://github.com/stoatchat/for-web/commit/81160f459de0fe8b685d2e5dddf3ae96e1ab7af1))
* properly use emoji preference on textEditor ([#540](https://github.com/stoatchat/for-web/issues/540)) ([f0dad75](https://github.com/stoatchat/for-web/commit/f0dad75d30ee04cdb1b218e15f1c3804b53d9611))
* Report Content Message overflows with embeds.  ([#538](https://github.com/stoatchat/for-web/issues/538)) ([92358b3](https://github.com/stoatchat/for-web/commit/92358b3b2e2766e24429936f2bc1ec7965e9bf97))
* Safari avatars not loading ([#551](https://github.com/stoatchat/for-web/issues/551)) ([e5400a0](https://github.com/stoatchat/for-web/commit/e5400a007b9edafe9f981ac0aba23b49461b46ca))
* use ch unit instead of px to avoid wrapping ([#560](https://github.com/stoatchat/for-web/issues/560)) ([5edaf86](https://github.com/stoatchat/for-web/commit/5edaf86ee36c5d9d415eb5f2427a24d2549d71be))

## [0.0.14](https://github.com/stoatchat/for-web/compare/stoat-for-web-v0.0.13...stoat-for-web-v0.0.14) (2025-11-19)


### Bug Fixes

* don't try to render age gate if channel is missing entirely ([#525](https://github.com/stoatchat/for-web/issues/525)) ([a12d9c1](https://github.com/stoatchat/for-web/commit/a12d9c1799278343cedad487bf0e006013bc5658))
* hardware acceleration config button ([#524](https://github.com/stoatchat/for-web/issues/524)) ([ed90f66](https://github.com/stoatchat/for-web/commit/ed90f664cadc6b11d31521e2d5e9bf1fe081a511))
* links in settings, spellchecking, bot creation, U.S. dayjs locale, confirm msg delete by enter ([#521](https://github.com/stoatchat/for-web/issues/521)) ([5ac1409](https://github.com/stoatchat/for-web/commit/5ac140985602b578ddddcf38d10493d9a15dc42a))
* prevent duplicate link warning modals ([#516](https://github.com/stoatchat/for-web/issues/516)) ([1f39479](https://github.com/stoatchat/for-web/commit/1f394793ef2499eaf2700336b408791104b856e9))
* reset profile bio from latest data ([#515](https://github.com/stoatchat/for-web/issues/515)) ([7f0d46e](https://github.com/stoatchat/for-web/commit/7f0d46e8dc71d2824ba9262f1b6aec946ae90506))
* sliders in appearance not rendering ([#518](https://github.com/stoatchat/for-web/issues/518)) ([f6a0377](https://github.com/stoatchat/for-web/commit/f6a0377227519428ef560e82a45e3d69265d4db1))
* truncate UserMenu status text ([#517](https://github.com/stoatchat/for-web/issues/517)) ([1332562](https://github.com/stoatchat/for-web/commit/133256223ccf6c8826ef63b6b234a1d7319a4fa3))
