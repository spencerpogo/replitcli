const fs = require("fs").promises;
const path = require("path");

const logs = require("./logs");

const decoder = new TextDecoder();
let configFile;
let cache = { set: false, data: null };

const isObject = (obj) => obj && obj.constructor === {}.constructor;

const setConfigFile = (filename) => {
  configFile = filename;
};

const _readAndParseConfig = async () => {
  logs.debug(`Reading ${configFile}`);
  const text = decoder.decode(await fs.readFile(configFile));
  const data = JSON.parse(text);
  logs.debug("Read configuration:", data);
  if (!isObject(data)) {
    throw new Error("Loaded JSON is not an object");
  }
  cache = { set: true, data };
  return data;
};

const writeConfig = async (config) => {
  logs.debug(`Writing to ${configFile}`, config);
  const text = JSON.stringify(config);
  await fs.writeFile(configFile, text);
  cache = { set: true, data: config };
};

/**
 * @description Load the configuration. If _readAndParseConfig errors, write and return a blank configuration ({}).
 */
const _loadConfig = async () => {
  let data;
  try {
    data = await _readAndParseConfig();
  } catch (e) {
    logs.debug("Ignored error occurred while reading config:", e);
    await writeConfig({});
    data = {};
  }
  return data;
};

const getConfig = async () => {
  if (cache.set) {
    logs.debug("Configuration cached");
    return cache.data;
  } else {
    return await _loadConfig();
  }
};
//  cache.set ? cache.data : await _loadConfig();

/**
 * @description Update the configuration by combining with it.
 * @param newValues the values to add to the configuration
 */
const update = async (newValues) => {
  const config = await getConfig();
  await writeConfig({ ...config, ...newValues });
};

/**
 * @description find a directory in config.localDirs that is a parent of process.cwd()
 *  or throw an error if it can't be found.
 */
const findLocalDir = async () => {
  const read = await getConfig();
  const localDirs = read.localDirs || {};
  // if the prop is empty, don't even bother
  if (Object.keys(localDirs).length == 0) {
    return null;
  }
  let cwd = process.cwd();
  let lastCwd;
  // when we traverse up to / or C:\ path.dirname will not change anything.
  //  that is when we break out of the loop
  while (!localDirs[cwd] && cwd != lastCwd) {
    lastCwd = cwd;
    cwd = path.dirname(cwd);
  }
  // If we still didn't find anything
  if (!localDirs[cwd]) {
    return null;
  }
  return localDirs[cwd];
};

module.exports = {
  setConfigFile,
  _readAndParseConfig,
  writeConfig,
  _loadConfig,
  getConfig,
  update,
  getConfigFile: () => configFile,
  findLocalDir,
};
