const Importer = require('mysql-import');
Importer.prototype.setEncoding('utf8');

module.exports = class ImportSQL {
    constructor(connection, path) {
        this.importer = new Importer(connection);
        this.file = path;
    }

    import(callback) {
        if (this.file != null && this.file != "" && this.file != undefined) {
            this.importer.import(this.file).then(() => {
                const files_imported = this.importer.getImported();
                callback(null, files_imported);
            }).catch(err => {
                callback(null, err);
            });
        } else {
            callback(null, "No SQL file");
        }
    }
}