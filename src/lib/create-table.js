module.exports = class CreateTable {
    constructor(props) {
        this.keys = props.keys;
        this.fields = props.fields;
        this.table = props.table_name;
        this.alterfields = props.alterfields;
        this.columnStatement = [];
        this.statementCreate = [];
        this.statementAlter = [];
    }

    createColumnScript() {
        try {
            if (this.table != null && this.fields != null && this.keys != null) {
                for (let i = 0; i < this.keys.length; i++) {
                    this.columnStatement = [];
                    this.key = this.keys[i];
                    this.props = this.fields[this.keys[i]];

                    this.createColumnName();
                    this.createColumnType();
                    this.createColumnAutoIncrement();
                    // this.createColumnIsNull();
                    this.createColumnIsPrimary();

                    this.statementCreate.push(this.columnStatement.join(" "));
                }
                return "create table if not exists " + this.table + "(" + this.statementCreate.join(", ") + ")";
            }

        } catch (error) {
            return "Create Script Failed: " + error.message, "request_create_table_error";
        }
    }

    alterTable() {
        // add column
        const addFields = this.alterfields.alterAddFields;
        for (let i = 0; i < addFields.length; i++) {
            this.columnStatement = [];
            this.key = addFields[i];
            this.props = this.fields[this.key];

            this.createColumnName();
            this.createColumnType();
            this.createColumnAutoIncrement();
            // this.createColumnIsNull();
            this.createColumnIsPrimary();

            this.statementCreate.push(this.columnStatement.join(" "));

            if (!this.props.is_primary) {
                this.statementAlter.push("add " + this.columnStatement.join(" "));
            }
        }

        // modify column
        const modifyFields = this.alterfields.alterModifyFields;
        for (let i = 0; i < modifyFields.length; i++) {
            this.columnStatement = [];
            this.key = modifyFields[i];
            this.props = this.fields[this.key];

            this.createColumnName();
            this.createColumnType();
            this.createColumnAutoIncrement();
            // this.createColumnIsNull();
            this.createColumnIsPrimary();

            this.statementCreate.push(this.columnStatement.join(" "));

            if (!this.props.is_primary) {
                this.statementAlter.push("modify " + this.columnStatement.join(" "));
            }
        }

        return "alter table " + this.table + " " + this.statementAlter.join(", ");
    }

    createColumnName() {
        this.columnStatement.push(this.key);
    }

    createColumnType() {
        let length = null;
        let stmt = null;
        switch (this.props.type) {
            case "number":
                length = this.props.length;
                switch (true) {
                    case (length < 3):
                        stmt = "smallint(" + this.props.length + ")";
                        break;
                    case (length >= 3):
                        stmt = "int(" + this.props.length + ")";
                        break;
                }
                stmt += this.createColumnIsNull();
                stmt += this.props.default != undefined ? " default " + this.props.default : "";
                break;
            case "text":
                length = this.props.length;
                switch (true) {
                    case (length <= 255):
                        stmt = "varchar(" + this.props.length + ")";
                        break;
                    case (length > 255):
                        stmt = this.props.type;
                        break;
                }
                stmt += this.createColumnIsNull();
                stmt += this.props.default != undefined ? " default '" + this.props.default + "'" : "";
                break;
            case "enum":
                stmt = this.enumValue();
                stmt += this.createColumnIsNull();
                stmt += this.props.default != undefined ? " default '" + this.props.default + "'" : "";
                break;
            case "datetime":
                stmt = this.props.type;
                stmt += this.createColumnIsNull();
                stmt += this.props.default != undefined ? " default " + this.props.default : "";
                break;
            default:
                stmt = this.props.type;
                stmt += this.createColumnIsNull();
                stmt += this.props.default != undefined ? " default '" + this.props.default + "'" : "";
                break;
        }

        this.columnStatement.push(stmt);
    }

    createColumnAutoIncrement() {
        switch (this.props.auto_increment) {
            case true:
                this.columnStatement.push("auto_increment");
                break;
        }
    }

    createColumnIsNull() {
        switch (this.props.require) {
            case true:
                return " not null ";
            case false:
                return " null ";
        }
    }

    createColumnIsPrimary() {
        switch (this.props.is_primary) {
            case true:
                this.columnStatement.push("primary key");
                break;
        }
    }

    // createColumnIsForeign() {
    //     switch (this.props.is_fk) {
    //         case true:
    //             this.columnStatement.push("foreign key references " + this.props.ref + "(" + this.key + ")");
    //             break;
    //     }
    // }

    enumValue() {
        let value = [];
        for (const element of this.props.value) { value.push("'" + element + "'") }
        let statement = "enum(" + value.join() + ")";

        return statement;
    }

};