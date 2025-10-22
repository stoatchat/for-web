import type { API } from "stoat.js";

export type Props = {
  /**
   * User we are dealing with
   * @default Invisible
   */
  status?: API.Presence;
};

/**
 * Overlays user status in current SVG
 */
const UserStatusGraphic = (props: Props) => {
  /**
   * Convert status to lower case
   */
  const statusLowercase = () => props.status?.toLowerCase() ?? "invisible";

  return (
    <circle
      cx="27"
      cy="27"
      r="5"
      fill={`var(--brand-presence-${statusLowercase()})`}
      mask={`url(#accessible-status-${statusLowercase()})`}
    />
  );
};

/**
 * Stand-alone user status element
 */
export function UserStatus(props: Props & { size: string }) {
  return (
    <svg viewBox="22 22 10 10" height={props.size}>
      <UserStatusGraphic {...props} />
    </svg>
  );
}

UserStatus.Graphic = UserStatusGraphic;
