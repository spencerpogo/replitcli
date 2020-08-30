const { createCommand } = require("commander");

const { listenForResize }

const main = async () => {

};

module.exports = createCommand()
  .name("bash")
  .storeOptionsAsProperties(false)
  .passCommandToAction(false)
  .action(main);
