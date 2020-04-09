const fse = require('fs-extra')
const path = require('path');
const projectPath = path.join(__dirname, "..", "..");

module.exports = class CreateFunction {
    constructor(functionName) {
        this.functionName = functionName;
    }
    create() {

        const from = projectPath + "/template/template-function";
        const destination = projectPath + "/function/" + this.functionName;
        this.destination = destination;
        console.log("Create Function");
        console.log("Copying from: ", from, " to: ", destination);
        try {
            fse.copySync(from, destination)
            console.log('Copy function ' + this.functionName + ' success.');
            return true;
        } catch (err) {
            console.error("can not create function", err);
            return false;
        }

        
        // fse.copy(from, destination, err => {
        //     if (err) {
        //         this.callback(null, {
        //             status: false,
        //             message: "can not create function"
        //         });
        //     } else {
        //         console.log('Copy function ' + this.functionName + ' success.');
        //         this.callback(null, {
        //             status: true,
        //             message: "create function success"
        //         });
        //     }

        // })
    }
    renameFile() {
        const controllerPath = this.destination + "/controller/master-data-v2-module.js";
        const renamePath = this.destination + "/controller/" + this.functionName + ".js";

        fs.rename(controllerPath, renamePath, function (err) {
            if (err) console.log('ERROR: ' + err);
            this.replaceIndexScript();
        });
    }

    replaceIndexScript() {
        const indexFile = this.destination + "/index.js";
        fs.readFile(indexFile, 'utf8', function (err, data) {
            if (err) {
                return console.log(err);
            }

            let result = data;
            result = result.replace(/MasterDataV2/g, capitalizeFirstLetter(this.functionName));
            result = result.replace(/master-data-v2-module/g, this.functionName);

            fs.writeFile(indexFile, result, 'utf8', function (err) {
                if (err) return console.log(err);
                this.replaceControllerScript();
            });
        });
    }

    replaceControllerScript() {
        const controllerFile = this.destination + "/controller/" + this.functionName + ".js";
        fs.readFile(controllerFile, 'utf8', function (err, data) {
            if (err) {
                return console.log(err);
            }

            let result = data;
            result = result.replace(/MasterDataV2/g, this.capitalizeFirstLetter(this.functionName));

            fs.writeFile(controllerFile, result, 'utf8', function (err) {
                if (err) return console.log(err);
                this.callback(null, {
                    status: true,
                    message: "create function success."
                });
            });
        });
    }

    capitalizeFirstLetter(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}