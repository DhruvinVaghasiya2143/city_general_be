const bcrypt = require("bcrypt");

const generateSalt = async () => {
  return await bcrypt.genSalt(10);
};

const generateHashedPassword = async (password) => {
  const salt = await generateSalt();
  return await bcrypt.hash(password, salt);
};

module.exports = {
  generateHashedPassword,
};
