const path = require("path");
const AutoGenerate = require('./src/auto-generate');

// db config
const db = {
    host: "localhost",
    user: "root",
    password: "",
    port: 3306,
    database: "temp"
};

// Module Path
const moduleGeneratePath = path.join(__dirname, "module");          // to generate
const moduleGenerateConfigPath = path.join(__dirname, "config");    // to export

// SQL path
const sqlFolderPath = path.join(__dirname, "sql");
// Postman path
const postmanPath = path.join(__dirname, "collection");

const pathConfig = {
    moduleGeneratePath: moduleGeneratePath, 
    moduleGenerateConfigPath: moduleGenerateConfigPath, 
    sqlFolderPath: sqlFolderPath, 
    postmanPath: postmanPath
};

const exportConnectionPath = path.join(__dirname, "config");
// encrypt db by cryptr
const option = {
    isDatabaseEncrypt: true,
    secretKey: "a5!93D",
    tokenSecretKey: "$3C123t",
    pathToExport: exportConnectionPath
};

const autoGenerate = new AutoGenerate(db, pathConfig, option);
autoGenerate.generate((err, res) => {
    console.log(res);
    process.exit();
});