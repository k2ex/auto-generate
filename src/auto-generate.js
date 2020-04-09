const ImportSQL = require('./lib/import-sql');
const ModuleGenerate = require("./lib/module-generate");
const envCryptr = require("./lib/env-cryptr");

module.exports = class AutoGenerate {
    constructor(dbConnect, path, option) {
        this.connection = dbConnect;
        this.modulePath = {
            moduleGeneratePath: path.moduleGeneratePath,
            moduleGenerateConfigPath: path.moduleGenerateConfigPath
        };
        this.postmanPath = path.postmanPath;
        this.sqlImportPath = path.sqlFolderPath;
        console.log(this.sqlImportPath);
        
        this.option = option;
    }

    generate(callback) {
        this.callback = callback;
        this.encryptDatabase();
    }

    encryptDatabase() {
        if (this.option.isDatabaseEncrypt) {
            let encryptConfig = envCryptr.encrypt(JSON.stringify(this.connection), this.option.secretKey);
            let config = {
                database: {
                    dbConnect: encryptConfig,
                    secretKey: this.option.secretKey,
                    connectionLimit: this.option.connectionLimit == undefined ? 10 : this.option.connectionLimit,
                    useLambdaConnectionPool: this.option.useLambdaConnectionPool == undefined ? false : this.option.useLambdaConnectionPool,
                },
                tokenSecretKey: this.option.tokenSecretKey == undefined ? this.option.secretKey : this.option.tokenSecretKey
            };

            console.log(config);
            this.importSQLStatement();
        } else {
            this.importSQLStatement();
        }

    }

    importSQLStatement() {

        const importSQL = new ImportSQL(this.connection, this.sqlImportPath);
        importSQL.import((err, data) => {
            if (!err) {
                console.log("Import sql file success:", data);
                this.generateModule();
            } else {
                console.log("Import sql file not success:", err);
            }
        });
    }

    generateModule() {
        if (this.modulePath != undefined) {
            new ModuleGenerate(this.connection, this.modulePath, this.postmanPath, undefined, (err, res) => {
                this.callback(null, res);
            });
        } else {
            this.callback(null, "Auto generate done.");
        }
    }
}