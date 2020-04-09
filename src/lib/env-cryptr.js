const Cryptr = require('cryptr');

module.exports = class envCryptr {
    constructor() {

    }
    static encrypt(data, key) {
        const crypto = new Cryptr(key);
        let encryptData = crypto.encrypt(data);
        return encryptData;
    }
    static decrypt(data, key) {
        const crypto = new Cryptr(key);
        let decryptData = crypto.decrypt(data);
        return decryptData;
    }
}
