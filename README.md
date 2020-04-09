AUTO GENERATE @godigit:

- auto create table by config JSON file.
- encrypt your database connection.
- auto import SQL file.

*** This package can be only use with @godigit/master-data package.

## How to create config JSON file

Those are 3 key you need to write config JSON file:
1. module_name
2. table_name
    - table field
3. route

## EXAMPLE
```
{
    "module_name": "customer",
    "table": {
        "tb_name": "customer",
        "tb_fields": {
            "customer_id": {
                "type": "number",
                "length": 11,
                "auto_increment": true,
                "require": true,
                "is_primary": true,
                "not_param": true
            },
            "customer_firstname": {
                "type": "text",
                "length": 360,
                "require": true
            },
            "customer_lastname": {
                "type": "text",
                "length": 320,
                "require": true
            },
            "created_date": {
                "type": "datetime",
                "length": 11,
                "require": false,
                "default": "current_timestamp",
                "not_param": true
            },
            "created_by": {
                "type": "text",
                "length": 100,
                "require": false
            },
            "updated_date": {
                "type": "datetime",
                "length": 11,
                "require": false,
                "default": "current_timestamp on update current_timestamp",
                "not_param": true
            },
            "updated_by": {
                "type": "text",
                "length": 100,
                "require": false
            }
        }
    },
    "route": "/customer"
}
```

## How to use package
```
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
const moduleGeneratePath = path.join(__dirname, "module");          // folder path are consist config JSON files to generate.
const moduleGenerateConfigPath = path.join(__dirname, "config");    // folder path to export config sql statement to use with master-data package 

// SQL path 
const sqlFolderPath = path.join(__dirname, "sql");      // folder path are consist SQL file
// Postman path
const postmanPath = path.join(__dirname, "collection"); // folder path to export postman collection file

const pathConfig = {
    moduleGeneratePath: moduleGeneratePath, 
    moduleGenerateConfigPath: moduleGenerateConfigPath, 
    sqlFolderPath: sqlFolderPath, 
    postmanPath: postmanPath
};

// encrypt db by cryptr: if isDatabaseEncrypt is True you need to put secretKey for encrypt db
const option = {
    isDatabaseEncrypt: true,
    secretKey: "XXXXXX",
    tokenSecretKey: "$3C123t"
};

// call auto generate function
const autoGenerate = new AutoGenerate(db, pathConfig, option);
autoGenerate.generate((err, res) => {
    console.log(res);
    process.exit();
});
```

