const core = require("@actions/core");
const handleMerge = require("./handle_merge");

main();

async function main() {
    handleMerge();
}

process.on("unhandledRejection", (reason, promise) => {
    core.warning("Unhandled Rejection at:");
    core.warning(promise);
    core.setFailed(reason);
});
