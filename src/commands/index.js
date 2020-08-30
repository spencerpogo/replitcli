/**
 * @description Load all of the command modules and add them into the given commander program
 */
module.exports = (program) => {
  ["auth", "bash"].forEach((cmd) => {
    program.addCommand(require("./" + cmd));
  });
};
