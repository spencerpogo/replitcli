const inquirer = require("inquirer");

/**
 * @description A wrapper around inquirer.prompt which handles a TTY error by exiting
 * @param args: Arguments to be passed to inquirer.prompt
 */
module.exports.handledPrompt = async (...args) => {
  try {
    return await inquirer.prompt(...args);
  } catch (e) {
    if (e.isTtyError) {
      module.exports.fatal("Error: Cannot run prompt without a tty present");
    } else {
      // throw any other unrecognized errors
      throw e;
    }
  }
};

/**
 * @description A heuristic to find invalid crosis keys
 * @param key: The key to check
 * @returns bool Whether the checks passed
 */
module.exports.isKey = (key) => {
  if (!key) return false;
  const parts = key.split(":");
  return parts.length == 2 && parts.every((p) => p.length > 5);
};
