import { useLingui } from "@lingui-solid/solid/macro";

/**
 * Translate any error
 */
export function useError() {
  const { t } = useLingui();

  return (error: any) => {
    // TODO: requests
    // TODO: HTTP errors

    if (error && typeof error.message === 'string' && error.message.trim()) {
      return error.message;
    }

    return t`Something went wrong! Try again later.`;
  };
}
