module.exports =
/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 704:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

module.exports = handleMerge;

const core = __nccwpck_require__(838);
const { Octokit } = __nccwpck_require__(48);

/**
 * handle "auto merge" event
 */
async function handleMerge() {  
  const octokit = new Octokit();
  const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");

  const eventPayload = require(process.env.GITHUB_EVENT_PATH);

  const mergeMethod = process.env.INPUT_MERGE_METHOD
  
  const baseBranch = process.env.INPUT_BASE_BRANCH
  const headBranch = process.env.INPUT_HEAD_BRANCH

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
        .filter((pullRequest) => isMergingFromHeadToBase(pullRequest, baseBranch, headBranch))
        .filter((pullRequest) => isntFromFork(pullRequest))
        .filter((pullRequest) => hasRequiredLabels(pullRequest))
        .map((pullRequest) => {
          core.info("PR branch info -> ${pullRequest.base}, ${pullRequest.owner}")
          return {
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
  }
}

function isntFromFork(pullRequest) {
  return !pullRequest.head.repo.fork;
}

function isMergingFromHeadToBase(pullRequest, baseBranch, headBranch) {
  core.info(`base branch: ${pullRequest.base.ref}`);
  core.info(`head branch: ${pullRequest.head.ref}`);
  return pullRequest.base.ref === baseBranch && pullRequest.head.ref === headBranch;
}

function hasRequiredLabels(pullRequest) {
    const labels = pullRequest.labels.map(label => label.name);

    if (labels.includes("readyToMerge") && !labels.includes("doNotMerge")) {
        core.info(`${pullRequest.html_url} can be merged`);
        return true;
    }
    core.info(`${pullRequest.html_url} cannont be merged`);
    return false;
}


/***/ }),

/***/ 123:
/***/ ((__unused_webpack_module, __unused_webpack_exports, __nccwpck_require__) => {

const core = __nccwpck_require__(838);
const handleMerge = __nccwpck_require__(704);

main();

async function main() {
    handleMerge();
}

process.on("unhandledRejection", (reason, promise) => {
    core.warning("Unhandled Rejection at:");
    core.warning(promise);
    core.setFailed(reason);
});


/***/ }),

/***/ 838:
/***/ ((module) => {

module.exports = eval("require")("@actions/core");


/***/ }),

/***/ 48:
/***/ ((module) => {

module.exports = eval("require")("@octokit/action");


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		if(__webpack_module_cache__[moduleId]) {
/******/ 			return __webpack_module_cache__[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId](module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	__nccwpck_require__.ab = __dirname + "/";/************************************************************************/
/******/ 	// module exports must be returned from runtime so entry inlining is disabled
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	return __nccwpck_require__(123);
/******/ })()
;