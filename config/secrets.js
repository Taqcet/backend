var crypto = require('crypto-js');
var secrets = {
  jwt: "shabam",
  cookie:"mamameya",
  cryto: "maysa attia",
  encrypt: value => crypto.AES.encrypt(value,secrets.cryto),
  decrypt: cipher =>{
    var bytes = crypto.AES.decrypt(cipher.toString(),secrets.cryto);
    return bytes.toString(crypto.enc.Utf8);
  }
};

module.exports = secrets;
