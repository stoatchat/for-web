import { Accessor, createMemo } from "solid-js";
import {
  Channel,
  Client,
  Message,
  Server,
  ServerMember,
  ServerRole,
  User,
} from "stoat.js";

export interface AutoCompleteSearchSpace {
  users?: User[];
  members?: ServerMember[];
  channels?: Channel[];
  roles?: ServerRole[];
}

function generateSearchSpaceFrom(
  object: Client | Server | Channel | Message,
  client: Client,
): AutoCompleteSearchSpace {
  if (object instanceof Message) {
    if (object.channel) return generateSearchSpaceFrom(object.channel, client);
  } else if (object instanceof Channel) {
    if (object.server) return generateSearchSpaceFrom(object.server, client);
    if (object.type === "Group") {
      return {
        users: object.recipients,
      };
    }
  } else if (object instanceof Server) {
    return {
      members: client.serverMembers.filter(
        (member) => member.id.server === object.id,
      ),
      channels: object.channels,
      roles: [...object.roles.values()],
    };
  }

  return {};
}

export function useSearchSpace(
  object: Accessor<Client | Server | Channel | Message>,
  client: Accessor<Client>,
): Accessor<AutoCompleteSearchSpace> {
  return createMemo(() => generateSearchSpaceFrom(object(), client()));
}
