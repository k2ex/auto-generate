const fs = require('fs');
const path = require('path');
const DOWNLOAD_DIR = "./db-script";
class ExportSql {
    constructor(moduleName, script) {
        this.moduleName = moduleName;
        this.script = script;
    }

    export() {
        const filePath = path.join(DOWNLOAD_DIR, this.moduleName + ".sql");
        fs.writeFile(filePath, this.script.join(";\n"), function(err) {
            if(err) {
                console.log("script can not created: ", err);
                return false
            }
            console.log("script was created: ", filePath);
            return true;
        }); 
        
    }
}

module.exports = ExportSql;