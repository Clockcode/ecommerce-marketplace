const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  userCreated: {
    type: Date,
    default: Date.now(),
  },
  type: {
    type: String,
    default: "user",
  },
});
userSchema.pre("save", function (next) {
  bcrypt
    .genSalt(10)
    .then((salt) => {
      bcrypt
        .hash(this.password, salt)
        .then((encryptedPass) => {
          this.password = encryptedPass;
          next();
        })
        .catch((err) => {
          `Hashing Error occured: ${err}`;
        });
    })
    .catch((err) => {
      console.log(`Salting Error Occured: ${err}`);
    });
});
module.exports = mongoose.model("User", userSchema);
