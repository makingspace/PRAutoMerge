module.exports = handleMerge;

const core = require("@actions/core");
const { Octokit } = require("@octokit/action");

/**
 * handle "auto merge" event
 */
async function handleMerge() {  
  const octokit = new Octokit();
  const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");
  const eventPayload = require(process.env.GITHUB_EVENT_PATH);
  const mergeMethod = process.env.INPUT_MERGE_METHOD;
  core.info(`Loading open pull requests`);
  const pullRequests = await octokit.paginate(
    "GET /repos/:owner/:repo/pulls",
    {
      owner,
      repo,
      state: "open",
    },
    (response) => {
      return response.data
        .filter((pullRequest) => isMergingFromHeadToBase(pullRequest))
        .filter((pullRequest) => isntFromFork(pullRequest))
        .filter((pullRequest) => hasRequiredLabels(pullRequest))
        .map((pullRequest) => {
          return {
            title: pullRequest.title || "No title",
            body: pullRequest.body || "No decription",
            number: pullRequest.number,
            html_url: pullRequest.html_url,
            ref: pullRequest.head.sha,
            base: pullRequest.base.ref,
            head: pullRequest.head.ref
          };
        });
    }
  );

  core.info(`${pullRequests.length} scheduled pull requests found`);
  
  for await (const pullRequest of pullRequests) {
    await octokit.pulls.merge({
      owner,
      repo,
      pull_number: pullRequest.number,
      merge_method: mergeMethod
    });
      
    core.info(`${pullRequest.html_url} merged`);
    
    // make sure there is no other combination of x.x.x before the actual version number
    const tagName = pullRequest.title.match(/\d+\.\d+\.\d+/);
    // return match for any block of description in PR between **ReleaseNote** and **EndOfReleaseNote**
    const prBody = pullRequest.body.match(/\*\*ReleaseNote\*\*[^]*\*\*EndOfReleaseNote\*\*/)[0] || "empty body";
    await octokit.repos.createRelease({
      owner,
      repo,
      tag_name: "${tagName}",
      name: pullRequest.title,
      body: prBody
    });
    core.info(`release ${tagName} created for ${pullRequest.title}`);
    core.info(`release note:`);
    core.info(prBody);
  }
}

function isntFromFork(pullRequest) {
  return !pullRequest.head.repo.fork;
}

function isMergingFromHeadToBase(pullRequest) {
  core.info(`***${pullRequest.html_url}***`);
  core.info(`base branch: ${pullRequest.base.ref}`);
  core.info(`head branch: ${pullRequest.head.ref}`);
  return pullRequest.base.ref === 'master' && pullRequest.head.ref === 'develop';
}

function hasRequiredLabels(pullRequest) {
    const labels = pullRequest.labels.map(label => label.name);

    if (labels.includes("readyToMerge") && !labels.includes("doNotMerge")) {
        core.info(`${pullRequest.html_url} can be merged`);
        return true;
    }
    core.info(`${pullRequest.html_url} cannot be merged`);
    return false;
}
