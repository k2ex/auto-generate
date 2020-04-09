const mysql = require('mysql');

class DbManage {
    constructor() { }
    static connect(dbConnection) {
        this.db = dbConnection;
        if (this.pool == null) {
            console.log("init pool");
            this.pool = mysql.createPool(dbConnection);
        }
    }
    static getConnection() {
        return this.db;
    }
    static query(statement, param, callback) {
        this.pool.getConnection((err, conn) => {
            this.conn = conn;
            if (err) {
                console.log(err.message);
            } else {
                let queryRes = this.conn.query(statement, param, (err, result, fields) => {
                    this.conn.release();
                    if (err) {
                        return callback(err, null);
                    }

                    return callback(null, result);
                });

                this.lastQueryStatement = queryRes.sql;
            }

        });

    }
    static getLastQueryStatement() {
        return this.lastQueryStatement;
    }
}

module.exports = DbManage;