const chalk = require("chalk")

let debugEnabled = false;

module.exports.enableDebug = () => {
  debugEnabled = true;
  console.log("Debug logging enabled.");
};

module.exports.disableDebug = () => {
  debugEnabled = false;
  console.log("Debug logging disabled.");
};

module.exports.debug = (...logs) => {
  if (debugEnabled) {
    console.debug("[DEBUG]", ...logs);
  }
};

/**
 * @description Print an error to stderr and exit with exit code 1 (error)
 * @param error The message to print
 */
module.exports.fatal = (error) => {
  process.stderr.write(chalk.red(error.toString() + "\n"));
  process.exit(1);
};

module.exports.errorToString = (e) =>
  e ? (typeof e.stack == "string" ? e.stack : "" + e) : "";
