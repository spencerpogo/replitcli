const { createCommand } = require("commander");
const open = require("open");

const { handledPrompt, isKey } = require("../utils");
const logs = require("../logs");
const config = require("../config");

const KEY_SITE = "https://devs.turbio.repl.co";

async function promptForKey() {
  console.log("To authenticate with this tool, you need a developer API key.");
  console.log(`You can get one from ${KEY_SITE}`);
  const { shouldOpen } = await handledPrompt([
    {
      type: "confirm",
      name: "shouldOpen",
      message: "Open URL in browser?",
    },
  ]);
  if (shouldOpen) {
    logs.debug("Opening site in browser");
    await open(KEY_SITE);
  }
  const { key } = await handledPrompt([
    {
      type: "password",
      name: "key",
      message: "Enter crosis key: ",
    },
  ]);
  return key;
}

async function main(options) {
  if (!options.key) {
    options.key = await promptForKey();
  }
  if (!isKey(options.key)) {
    logs.fatal(
      "That key looks invalid. Crosis keys should be in the form of xxxxx:xxxxx"
    );
  }
  logs.debug("Writing key to config");
  config.update({ key: options.key });
  console.log(`Wrote to config file: ${config.getConfigFile()}`);
}

module.exports = createCommand()
  .storeOptionsAsProperties(false)
  .name("auth")
  .description("Authenticate with the CLI")
  .option(
    "-k, --key <key>",
    "Use a specified key instead of prompting on the command line " +
      "(can be passed using REPLIT_KEY environment variable)",
    process.env.REPLIT_KEY
  )
  .action(main);
