/**
 * @description Load all of the command modules and add them into the given commander program
 */
module.exports = (program) => {
  ["auth", "bash", "local", "run", "cp", "exec", "bulk"].forEach((cmd) => {
    program.addCommand(require("./" + cmd));
  });
};
