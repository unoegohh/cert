const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CertSchema = new Schema(
  {
    firstName: {
      type: String,
      required: true
    },
    lastName: {
      type: String,
      required: true
    },
    certs: {
      type: [
        {
          country: {
            type: String,
          },
          date: {
            type: String,
            required: true
          },
          salt: {
            type: String
          },
          link: {
            type: String,
            required: true
          }
        }
      ]
    }
  },
  {
    strict: true
  }
);

const Cert = mongoose.model("Certs", CertSchema);

module.exports = Cert;
