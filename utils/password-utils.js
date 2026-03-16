const bcrypt = require("bcrypt");

const generateSalt = async () => {
  return await bcrypt.genSalt(10);
};

const generateHashedPassword = async (password) => {
  const salt = await generateSalt();
  return await bcrypt.hash(password, salt);
};

const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

module.exports = {
  generateHashedPassword,
  comparePassword,
};
