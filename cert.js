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
          date: {
            type: String,
            required: true
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
