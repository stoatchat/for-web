import { Trans } from "@lingui/solid/macro";
import {
  createResource,
  ErrorBoundary,
  Match,
  Show,
  Suspense,
  Switch,
} from "solid-js";

import { Bot, Server } from "stoat.js";
import { styled } from "styled-system/jsx";

import { useError } from "@revolt/i18n";
import { useInstance } from "@revolt/instance";
import { CategoryButton, CircularProgress, Symbol, Text } from "@revolt/ui";

export function Discoverable(props: {
  discoverable: Bot | Server;
  fullPage?: boolean;
}) {
  const { isStoat } = useInstance();
  const err = useError();

  const [discoverRequest, discoverRequestActions] = createResource(() =>
    props.discoverable.discoverRequestStatus(),
  );

  // We don't need to subscribe to props.discoverable.
  // eslint-disable-next-line solid/reactivity
  const onDiscoverRequestClick = (reset?: () => void) => () => {
    props.discoverable.requestDiscover().then(async () => {
      discoverRequestActions.refetch();
      reset?.();
    });
  };

  return (
    <Show when={isStoat}>
      <Show when={!props.fullPage}>
        <Text class="title" size="medium">
          <Trans>Discover</Trans>
        </Text>
      </Show>
      <Show
        when={!props.discoverable.discoverable}
        fallback={
          <MessagePreview>
            <Text class="title" size="small">
              <Trans>
                This {props.discoverable instanceof Bot ? "bot" : "server"} is
                discoverable
              </Trans>
            </Text>
            <Text>
              <Trans>
                Contact support to remove this{" "}
                {props.discoverable instanceof Bot ? "bot" : "server"} from
                discover
              </Trans>
            </Text>
          </MessagePreview>
        }
      >
        <Suspense fallback={<CircularProgress />}>
          <ErrorBoundary
            fallback={(e: Error, reset) => {
              // Parse the error because a 404 means you can request.
              const parsed = JSON.parse(e.message);
              if (parsed.type === "NotFound") {
                return (
                  <DiscoverButton
                    discoverable={props.discoverable}
                    onDiscoverRequestClick={onDiscoverRequestClick(reset)}
                  />
                );
              }
              return (
                <MessagePreview>
                  <Text class="title" size="small">
                    <Trans>Can't get discover request status right now</Trans>
                  </Text>
                  <Text>{err(e.message)}</Text>
                </MessagePreview>
              );
            }}
          >
            <Show
              when={discoverRequest()}
              keyed={true}
              fallback={
                <MessagePreview>
                  <Text class="title" size="small">
                    <Trans>Can't get discover request status right now</Trans>
                  </Text>
                  <Text>Please try again later</Text>
                </MessagePreview>
              }
            >
              {(dr) => {
                return (
                  <Switch>
                    <Match
                      when={
                        dr.status === "Pending" || dr.status === "UnderReview"
                      }
                    >
                      <MessagePreview>
                        <Text class="title" size="small">
                          <Trans>
                            Your{" "}
                            {props.discoverable instanceof Bot
                              ? "bot"
                              : "server"}{" "}
                            is under review
                          </Trans>
                        </Text>
                        <Text>
                          <Trans>
                            Check back often to see if your{" "}
                            {props.discoverable instanceof Bot
                              ? "bot"
                              : "server"}{" "}
                            has been approved!
                          </Trans>
                        </Text>
                      </MessagePreview>
                      <CategoryButton.Group>
                        <CategoryButton
                          description={
                            <Trans>
                              Cancel your discover request and remove it from
                              the review queue
                            </Trans>
                          }
                          icon={<Symbol size={22}>cancel</Symbol>}
                          action="chevron"
                          onClick={() =>
                            props.discoverable
                              .cancelDiscoverRequest()
                              .then(async () =>
                                discoverRequestActions.refetch(),
                              )
                          }
                        >
                          <Trans>Cancel discover request</Trans>
                        </CategoryButton>
                      </CategoryButton.Group>
                    </Match>
                    <Match
                      when={
                        typeof dr.status === "object" &&
                        (dr.status as { Denied: string | null }).Denied !==
                          undefined
                      }
                    >
                      <MessagePreview>
                        <Text class="title" size="small">
                          <Trans>Your discover request has been denied</Trans>
                        </Text>
                        <Text>
                          {(dr.status as { Denied: string | null }).Denied ? (
                            <>
                              <Trans>
                                Reason:{" "}
                                {
                                  (dr.status as { Denied: string | null })
                                    .Denied
                                }
                              </Trans>
                              <br />
                            </>
                          ) : undefined}
                          <Trans>You can request again below</Trans>
                        </Text>
                      </MessagePreview>
                      <DiscoverButton
                        discoverable={props.discoverable}
                        onDiscoverRequestClick={onDiscoverRequestClick()}
                      />
                    </Match>
                    <Match
                      when={
                        typeof dr.status === "object" &&
                        (dr.status as { Removed: string | null }).Removed !==
                          undefined
                      }
                    >
                      <MessagePreview>
                        <Text class="title" size="small">
                          <Trans>Your discover request has been removed</Trans>
                        </Text>
                        <Text>
                          {(dr.status as { Removed: string | null }).Removed ? (
                            <>
                              <Trans>
                                Reason:{" "}
                                {
                                  (dr.status as { Removed: string | null })
                                    .Removed
                                }{" "}
                                Contact support for more information.
                              </Trans>
                              <br />
                            </>
                          ) : undefined}
                        </Text>
                      </MessagePreview>
                    </Match>
                  </Switch>
                );
              }}
            </Show>
          </ErrorBoundary>
        </Suspense>
      </Show>
    </Show>
  );
}

function DiscoverButton(props: {
  discoverable: Bot | Server;
  onDiscoverRequestClick: () => void;
}) {
  return (
    <CategoryButton.Group>
      <CategoryButton
        description={
          props.discoverable instanceof Bot ? (
            <Trans>
              Allow others to add your bot to their servers from Discover
            </Trans>
          ) : (
            <Trans>Allow others to join your server from Discover</Trans>
          )
        }
        icon={<Symbol size={22}>public</Symbol>}
        action="chevron"
        onClick={props.onDiscoverRequestClick}
      >
        <Trans>Submit to Discover</Trans>
      </CategoryButton>
    </CategoryButton.Group>
  );
}

const MessagePreview = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    padding: "var(--gap-md)",
    gap: "var(--message-group-spacing)",
  },
});
