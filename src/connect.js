const axios = require("axios");

const logs = require("./logs");
const BetterCrosis = require("./crosis");
const { getConfig } = require("./config");
const chalk = require("chalk");
//const { isKey } = require("./utils");

// TODO: Figure out best method to get ids for private repls
// Options, best to worst:
// - Ask the team to make a method where given a crosis key you can access private repl ids
// - Tell them to paste some js in their console or visit a URL
// - Get user's login creds (probably not a good idea)
// - Ask the team to make a basic oauth route specifically for the CLI: open a web server on localhost, redirect to a route, get premission, redirect back (probably impractical)

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

const getClient = async (replId) => {
  const { key } = await getConfig();
  // no clue why but this doesn't work if I require it at the top of the file
  // very weird :shrug:
  const { isKey } = require("./utils");
  if (!isKey(key)) {
    logs.fatal(
      "Missing crosis API Key! Before running this command, please run auth command"
    );
  }

  process.stdout.write(chalk.green("Starting crosis connection...\n"));
  const client = new BetterCrosis();
  try {
    await client.connect(replId, key);
  } catch (e) {
    console.error(e);
    logs.fatal("Error while connecting!");
  }
  return client;
};

module.exports = {
  performDataRequest,
  getClient,
};
