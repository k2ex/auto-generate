const fs = require("fs");
const path = require('path');
const projectPath = path.join(__dirname, "..", "..");
module.exports = class GenerateConfig {
    constructor(config, isGenerateLambda, path) {
        this.config = config;

        if (isGenerateLambda) {
            this.configFile = projectPath + "/function/" + this.config.module_name + "/config/get-data-config.json";
        } else {
            this.configFile = path + "\\" + this.config.module_name + ".json";
        }

        console.log(this.configFile);
        
        // this.configFile = projectPath + "/function/" + this.config.module_name+"/config/get-data-config.json";
    }
    generateQuery(callback) {
        let genGetMethod = this.generateSelect();
        let genPostMethod = this.generateInsert();
        let genPutMethod = this.generateUpdate();
        let genDeleteMethod = this.generateDelete();
        try {
            if (fs.existsSync(this.configFile)) {
                fs.readFile(this.configFile, "utf-8", (err, data) => {
                    if (!err) {
                        let config = JSON.parse(data);
                        config.GET["select_" + this.config.module_name] = genGetMethod,
                            config.POST["insert_" + this.config.module_name] = genPostMethod,
                            config.PUT["update_" + this.config.module_name] = genPutMethod,
                            config.DELETE["delete_" + this.config.module_name] = genDeleteMethod,
                            fs.writeFile(this.configFile, JSON.stringify(config, null, 4), "utf-8", (err) => {
                                callback(err, null);
                            });
                    } else {
                        callback(err, data);
                    }
                });
            } else {

                let newConfig = {
                    GET: {},
                    POST: {},
                    PUT: {},
                    DELETE: {}
                }

                newConfig.GET["select_" + this.config.module_name] = genGetMethod;
                newConfig.POST["insert_" + this.config.module_name] = genPostMethod;
                newConfig.PUT["update_" + this.config.module_name] = genPutMethod;
                newConfig.DELETE["delete_" + this.config.module_name] = genDeleteMethod;
                
                // let newConfig = {
                //     GET: {
                //         default: genGetMethod
                //     },
                //     POST: {
                //         default: genPostMethod
                //     },
                //     PUT: {
                //         default: genPutMethod
                //     },
                //     DELETE: {
                //         default: genDeleteMethod
                //     }
                // }
                fs.writeFile(this.configFile, JSON.stringify(newConfig, null, 4), "utf-8", (err) => {
                    callback(err, null);
                })
            }
        } catch (err) {
            callback(err, null);
        }
    }
    generateSelect() {
        let fieldList = this.config.keys.join(",");
        let querySelect = "SELECT " + fieldList + " FROM " + this.config.table_name;
        // let response = {};
        // for (let fieldName in this.config.fields) {
        //     let currentField = this.config.fields[fieldName];
        //     if (currentField.response_name) {
        //         response[currentField.response_name] = fieldName
        //     } else {
        //         response[fieldName] = fieldName
        //     }
        // }
        return {
            responseName: "get" + this.capitalizeFirstLetter(this.config.module_name),
            queryStatement: querySelect,
            // response: response
        };
    }
    generateInsert() {
        let fieldList = [];
        let paramList = [];
        let queryParam = [];
        for (let fieldName in this.config.fields) {
            let currentField = this.config.fields[fieldName];
            if (currentField.not_param !== true) {
                if (!currentField.auto_increment) {
                    fieldList.push(fieldName)
                    let paramName = fieldName;
                    if (currentField.param_name) {
                        paramName = currentField.param_name;
                    }
                    if (currentField.is_primary === true) {
                        paramList.push({
                            paramName: paramName,
                            require: currentField.require,
                            fieldName: fieldName
                        });
                    } else {
                        paramList.push({
                            paramName: paramName,
                            require: false,
                            fieldName: fieldName
                        });
                    }
                    queryParam.push("#" + paramName);
                }
            }
        }
        let queryInsert = "INSERT INTO " + this.config.table_name + "(" + fieldList.join(",") + ") VALUES(" + queryParam.join(",") + ")";
        return {
            responseName: "insert" + this.capitalizeFirstLetter(this.config.module_name),
            queryStatement: queryInsert,
            param: paramList
        };
    }
    generateUpdate() {
        let paramList = [];
        let queryParam = [];
        let whereParam = [];
        for (let fieldName in this.config.fields) {
            let currentField = this.config.fields[fieldName];
            if (currentField.not_param !== true || (currentField.not_param === true && currentField.is_primary === true)) {
                let paramName = fieldName;
                if (currentField.param_name) {
                    paramName = currentField.param_name;
                }
                paramList.push({
                    paramName: paramName,
                    require: currentField.require,
                    fieldName: fieldName
                });
                if (currentField.is_primary === true) {
                    whereParam.push("#" + paramName);
                } else {
                    queryParam.push("#" + paramName);
                }
            }
        }
        let queryUpdate = "UPDATE " + this.config.table_name + " SET " + queryParam.join(",") + " WHERE " + whereParam.join(" AND ");
        return {
            responseName: "update" + this.capitalizeFirstLetter(this.config.module_name),
            queryStatement: queryUpdate,
            param: paramList
        }
    }
    generateDelete() {
        let whereParam = [];
        let paramList = [];
        for (let fieldName in this.config.fields) {
            let currentField = this.config.fields[fieldName];
            let paramName = fieldName;
            if (currentField.param_name) {
                paramName = currentField.param_name;
            }
            if (currentField.is_primary === true) {
                whereParam.push("#" + paramName);
                paramList.push({
                    paramName: paramName,
                    require: currentField.require,
                    fieldName: fieldName
                });
            }
        }
        let queryDelete = "DELETE FROM " + this.config.table_name + " WHERE " + whereParam.join(" AND ");
        return {
            responseName: "delete" + this.capitalizeFirstLetter(this.config.module_name),
            queryStatement: queryDelete,
            param: paramList
        }
    }
    capitalizeFirstLetter(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}