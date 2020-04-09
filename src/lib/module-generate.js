const db = require('./db-manager');
const CreateTable = require("./create-table");
const CreateFunction = require("./create-function");
const CreateRoute = require("./create-route");
const ExportSql = require("./export-sql");
const GenerateConfig = require("./generate-config");
const uuid = require('uuid/v1')

const fs = require('fs');
const path = require('path');
let modulesConfig = null;

module.exports = class ModuleGenerate {
    constructor(connection, modulePath, postmanPath, option, callback) {
        db.connect(connection);
        this.callback = callback;
        this.queue = [];
        this.script = [];
        this.tablesAndFields = [];
        this.postmanPath = postmanPath;
        this.modulePath = modulePath.moduleGeneratePath;
        this.moduleGenerateConfigPath = modulePath.moduleGenerateConfigPath;

        if (option == undefined || option == null) {
            modulesConfig = {
                exportSqL: false,
                modulesName: "modules-script",
                generateLambda: false
            }
        }

        this.moduleDir = fs.readdirSync(this.modulePath, "utf-8");
        this.getTable();
    }

    getTable() {
        let statement = "SELECT TABLE_NAME AS table_name FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = '" + db.getConnection().database + "'";
        db.query(statement, {}, (err, data) => {
            if (!err) {
                this.allTables = data.map(table => table.table_name);
                this.getFieldsAllTables();
            }
        })
    }

    getFieldsAllTables() {
        if (this.allTables.length > 0) {
            this.tableName = this.allTables.shift();

            let statement = "show fields from " + this.tableName;
            db.query(statement, {}, (err, data) => {
                if (!err) {
                    const fields = data.map(fields => fields.Field);

                    const obj = {
                        tableName: this.tableName,
                        fields: fields
                    };

                    this.tablesAndFields.push(obj);
                    this.getFieldsAllTables();
                }
            })
        } else {
            this.initTable();
        }
    }

    initTable() {

        for (var i = 0; i < this.moduleDir.length; i++) {
            const moduleConfig = JSON.parse(fs.readFileSync(path.join(this.modulePath, this.moduleDir[i]), "utf8"));
            const fields = moduleConfig.table.tb_fields;
            let keys = Object.keys(fields);

            let props = {
                module_name: moduleConfig.module_name,
                table_name: moduleConfig.table.tb_name,
                keys: keys,
                fields: fields,
                route: moduleConfig.route
            }

            const tableInDatabase = this.tablesAndFields.find(obj => {
                if (obj.tableName == moduleConfig.table.tb_name) {
                    return obj;
                }
            });

            // exist table config in db, do alter
            if (tableInDatabase != undefined) {
                // fields table in db 
                const fieldsTableInDatabase = tableInDatabase.fields;
                // fields table in config file 
                const fieldsTableInConfig = Object.keys(fields);

                // diff config and db
                const alterAddFields = fieldsTableInConfig.filter(field => !fieldsTableInDatabase.includes(field));
                const alterModifyFields = fieldsTableInConfig.filter(field => fieldsTableInDatabase.includes(field));

                // add key to props
                props["alterfields"] = {
                    alterAddFields: alterAddFields,
                    alterModifyFields: alterModifyFields
                };

                // create alter script
                const createTable = new CreateTable(props);
                const script = createTable.alterTable();
                const data = {
                    script: script,
                    props: props
                }

                this.script.push(script);
                this.queue.push(data);

            } else {
                // dose not exist table in db, do create
                const createTable = new CreateTable(props);
                const script = createTable.createColumnScript();
                const data = {
                    script: script,
                    props: props
                }

                this.script.push(script);
                this.queue.push(data);
            }
        }

        if (modulesConfig.exportSqL) {
            const exportSql = new ExportSql(modulesConfig.modulesName, this.script);
            exportSql.export();
        }

        this.processQueue();

    }

    processQueue() {
        if (this.queue.length > 0) {
            this.moduleData = this.queue.shift();
            if (!modulesConfig.exportSqL) {
                console.log("Initial table name: " + this.moduleData.props.table_name);
                db.query(this.moduleData.script, {}, (err, data) => {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log("Table " + this.moduleData.props.table_name + " was created.");
                        if (modulesConfig.generateLambda) {
                            this.createFunction();
                        } else {
                            this.generateConfig();
                        }
                    }

                })
            } else {
                if (modulesConfig.generateLambda) {
                    this.createFunction();
                } else {
                    this.generateConfig();
                }
            }

        } else {
            if (this.postmanPath != undefined) {
                this.generateCollection();
            }
        }
    }

    createFunction() {

        const fc = new CreateFunction(this.moduleData.props.module_name);
        const isCreatedFunction = fc.create();
        if (isCreatedFunction) {
            this.createRoute();
        }
    }

    createRoute() {
        const data = {
            moduleName: this.moduleData.props.module_name,
            routeName: this.moduleData.props.route
        };

        const cr = new CreateRoute(data);
        const isCreatedRoute = cr.create();
        if (isCreatedRoute) {
            // this.processQueue();
            this.generateConfig();
        }
    }

    generateConfig() {
        let generateConfig = new GenerateConfig(this.moduleData.props, modulesConfig.generateLambda, this.moduleGenerateConfigPath);
        generateConfig.generateQuery((err, data) => {
            this.processQueue();
        });
    }

    generateCollection() {
        let postmanUuid = uuid();
        let date = new Date();
        let info = {
            "_postman_id": postmanUuid,
            "name": "Postman Collection " + date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
            "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
        };
        let itemFolder = [];
        for (let i = 0; i < this.moduleDir.length; i++) {
            let moduleConfig = JSON.parse(fs.readFileSync(path.join(this.modulePath, this.moduleDir[i]), "utf8"));
            // console.log(moduleConfig);
            let itemModule = {
                name: moduleConfig.module_name,
                item: [],
                protocolProfileBehavior: []
            };
            // console.log("aaa>>>",moduleConfig.table.tb_fields);
            let tbFieldData = moduleConfig.table.tb_fields;
            let pathReq = moduleConfig.route.replace(/^\//, "");
            let getParam = {};
            let postParam = {};
            let putParam = {};
            let deleteParam = {};
            for (let fieldName in tbFieldData) {
                let fieldProp = tbFieldData[fieldName];
                let paramName = fieldName;
                let type = fieldProp.type;
                if (type === "enum") {
                    type = fieldProp.value.join("|");
                }
                if (fieldProp.param_name) {
                    paramName = fieldProp.param_name;
                }
                if (fieldProp.is_primary === true) {
                    putParam[paramName] = type;
                    deleteParam[paramName] = type;
                    if (fieldProp.auto_increment !== true) {
                        postParam[paramName] = type;
                    }
                } else {
                    postParam[paramName] = type;
                    putParam[paramName] = type;
                }
            }
            itemModule.item.push({
                name: "get_" + moduleConfig.module_name,
                request: {
                    method: "GET",
                    header: [
                        {
                            key: "Content-Type",
                            "type": "text",
                            "value": "application/json"
                        }
                    ],
                    body: {
                        mode: "raw",
                        raw: JSON.stringify({ param: getParam }, null, "\t")
                    },
                    url: {
                        raw: "{{host}}/" + moduleConfig.route,
                        host: ["{{host}}"],
                        path: pathReq
                    }
                }
            });
            itemModule.item.push({
                name: "add_" + moduleConfig.module_name,
                request: {
                    method: "POST",
                    header: [
                        {
                            key: "Content-Type",
                            "type": "text",
                            "value": "application/json"
                        }
                    ],
                    body: {
                        mode: "raw",
                        raw: JSON.stringify({ param: postParam }, null, "\t")
                    },
                    url: {
                        raw: "{{host}}/" + moduleConfig.route,
                        host: ["{{host}}"],
                        path: pathReq
                    }
                }
            });
            itemModule.item.push({
                name: "update_" + moduleConfig.module_name,
                request: {
                    method: "PUT",
                    header: [
                        {
                            key: "Content-Type",
                            "type": "text",
                            "value": "application/json"
                        }
                    ],
                    body: {
                        mode: "raw",
                        raw: JSON.stringify({ param: putParam }, null, "\t")
                    },
                    url: {
                        raw: "{{host}}/" + moduleConfig.route,
                        host: ["{{host}}"],
                        path: pathReq
                    }
                }
            });
            itemModule.item.push({
                name: "delete_" + moduleConfig.module_name,
                request: {
                    method: "DELETE",
                    header: [
                        {
                            key: "Content-Type",
                            "type": "text",
                            "value": "application/json"
                        }
                    ],
                    body: {
                        mode: "raw",
                        raw: JSON.stringify({ param: deleteParam }, null, "\t")
                    },
                    url: {
                        raw: "{{host}}/" + moduleConfig.route,
                        host: ["{{host}}"],
                        path: pathReq
                    }
                }
            });
            itemFolder.push(itemModule);
            let postmanFile = {
                info: info,
                item: itemFolder,
                protocolProfileBehavior: []
            };
            fs.writeFile(this.postmanPath + "/postman_collection.json", JSON.stringify(postmanFile, null, "\t"), (err) => {
                if (err) {
                    this.errorResponse("script can not created: " + err, moduleConfig.module_name);
                    return false
                }
                this.responseData(moduleConfig.module_name);
            });
        }
    }

    responseData(module) {
        this.callback(null, "module " + module + " generate success.");
    }

    errorResponse(msg, module) {
        this.callback(null, "module " + module + " generate not success " + msg);
    }
}