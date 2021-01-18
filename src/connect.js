const axios = require("axios");

const logs = require("./logs");
const BetterCrosis = require("./crosis");
const { getConfig } = require("./config");
const chalk = require("chalk");

let showConnecting = true;

const setShowConnecting = (val) => {
  showConnecting = val;
};

const performDataRequest = async (user, repl) => {
  logs.debug(`Performing data request for ID of @${user}/${repl}`);
  try {
    const { data } = await axios.get(
      `https://repl.it/data/repls/@${user}/${repl}`
    );
    return data;
  } catch (e) {
    let msg = "";
    if (e && e.response && e.response.status == 404) {
      msg = `Repl not found: @${user}/${repl}
If this is a private repl, please open
https://repl.it/data/repls/@${user}/${repl}
Copy the id value near the beginning (should look like {"id":"COPY THIS"})
Re-run the command, replacing the repl name with id you copied`;
    } else {
      msg = `Error while getting repl ID of @${user}/${repl}: \n${logs.errorToString(
        e
      )}`;
    }
    logs.fatal(msg);
  }
};

module.exports = {
  performDataRequest,
  setShowConnecting,
};

module.exports._getClient = async (replId) => {
  const { key } = await getConfig();
  // no clue why but this doesn't work if I require it at the top of the file
  // very weird :shrug:
  const { isKey } = require("./utils");
  if (!isKey(key)) {
    logs.fatal(
      "Missing crosis API Key! Before running this command, please run auth command"
    );
  }

  if (showConnecting) {
    process.stderr.write(chalk.green("Starting crosis connection...\n"));
  }

  const client = new BetterCrosis();
  client._client.setUnrecoverableErrorHandler((err) => {
    console.error(err);
    logs.fatal("Unrecoverable crosis error occurred, exiting.");
  });

  try {
    await client.connect(replId, key);
  } catch (e) {
    console.error(e);
    logs.fatal("Error while connecting!");
  }
  return client;
};

module.exports.getClient = (replId) => module.exports._getClient(replId);
