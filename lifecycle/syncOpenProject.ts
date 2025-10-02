// This file synchronises issues and their status from OpenProject to GitHub
// deno run --allow-net --allow-env lifecycle/syncOpenProject.ts

const GH_TOKEN = Deno.env.get("GH_TOKEN");
const OP_TOKEN = Deno.env.get("OP_TOKEN");

const params = new URLSearchParams({
  offset: "1",
  pageSize: "1000",
  // filters: JSON.stringify([{ "status_id": { "operator": "o", "values": null }}]),
  sortBy: JSON.stringify([["id", "desc"]]),
});

const data: {
  _embedded: {
    elements: {
      id: number;
      subject: string;
      lockVersion: number;
      description: {
        raw: string;
      };
    }[];
  };
} = await fetch(
  "https://op.revolt.wtf/api/v3/projects/8/work_packages?" + params.toString(),
  {
    headers: {
      accept: "application/hal+json",
    },
  },
).then((r) => r.json());

const RE_ISSUE = /https:\/\/github\.com\/revoltchat\/frontend\/issues\/(\d+)/;

const ghIssues: {
  number: number;
  title: string;
}[] = await fetch(
  "https://api.github.com/repos/stoatchat/for-web/issues?per_page=100&sort=created",
).then((r) => r.json());

const issues: {
  id: number;
  subject: string;
  description: string;
  lockVersion: number;

  ghIssue: number | null;
}[] = data._embedded.elements.map(
  ({ id, subject, lockVersion, description: { raw: description } }) => {
    const issueMatch = description.match(RE_ISSUE)?.[1];

    return {
      id,
      subject,
      description,
      lockVersion,

      ghIssue: issueMatch ? parseInt(issueMatch) : null,
    };
  },
);

const idMapGHtoOP = Object.fromEntries(
  issues
    .filter((issue) => issue.ghIssue)
    .map((issue) => [issue.ghIssue, issue.id]),
);

// const idMapOPtoGH = Object.fromEntries(
//   issues
//     .filter((issue) => issue.ghIssue)
//     .map((issue) => [issue.id, issue.ghIssue]),
// );

const ghIssuesMap = Object.fromEntries(
  ghIssues.map((issue) => [issue.number, issue]),
);

for (const issue of ghIssues) {
  if (!idMapGHtoOP[issue.number]) {
    console.warn(`GH#${issue.number} is missing OpenProject issue`);
  }
}

for (const issue of issues) {
  if (issue.ghIssue) {
    const ghIssue = ghIssuesMap[issue.ghIssue];
    if (ghIssue) {
      const PREFIX = `[OP#${issue.id}] `;
      if (!ghIssue.title.startsWith(PREFIX)) {
        console.info(
          `GH#${issue.ghIssue} for OP#${issue.id} has incorrect title: "${ghIssue.title}"`,
        );

        await fetch(
          `https://api.github.com/repos/stoatchat/for-web/issues/${ghIssue.number}`,
          {
            method: "PATCH",
            headers: {
              Accept: "application/vnd.github+json",
              Authorization: `Bearer ${GH_TOKEN}`,
              "X-GitHub-Api-Version": "2022-11-28",
            },
            body: JSON.stringify({
              title: PREFIX + ghIssue.title,
            }),
          },
        );
      }
    } else {
      console.warn(`OP#${issue.id} links to non-existent GH#${issue.ghIssue}?`);
    }
  } else {
    console.info(`OP#${issue.id} is missing GitHub issue`);

    const PREFIX = `[OP#${issue.id}] `;
    const result: { html_url: string } = await fetch(
      `https://api.github.com/repos/stoatchat/for-web/issues`,
      {
        method: "POST",
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${GH_TOKEN}`,
          "X-GitHub-Api-Version": "2022-11-28",
        },
        body: JSON.stringify({
          title: PREFIX + issue.subject,
          body: `**[View issue on OpenProject](${`https://op.revolt.wtf/projects/revolt-for-web/work_packages/${issue.id}/activity`})**`,
        }),
      },
    ).then((r) => r.json());

    const url = `**[View issue on GitHub](${result.html_url})**`;
    await fetch(
      `https://op.revolt.wtf/api/v3/work_packages/${issue.id}?notify=false`,
      {
        method: "PATCH",
        body: JSON.stringify({
          // subject: issue.subject,
          description: {
            raw: issue.description.length
              ? `${issue.description}\n\n${url}`
              : url,
          },
          lockVersion: issue.lockVersion,
        }),
        headers: {
          Accept: "application/hal+json",
          "Content-Type": "application/json",
          Authorization: "Basic " + btoa("apikey:" + OP_TOKEN),
        },
      },
    )
      .then((r) => r.json())
      .then((res) => {
        if (res._type === "Error") throw res;
      });
  }
}
