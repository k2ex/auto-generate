const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');
const projectPath = path.join(__dirname, "..", "..");

module.exports = class CreateRoute {
    constructor(data) {
        this.routeName = data.routeName;
        this.moduleName = data.moduleName;
    }

    create() {
        const routePath = projectPath + "/configs/routes/" + this.routeName + "-route.json"
        const route = {};
        route[this.routeName] = {};
        route[this.routeName]["all"] = {
            function: this.moduleName,
            handler: "index.js"
        };

        console.log("Create Route. . .");
        try {
            fs.writeFileSync(routePath, JSON.stringify(route), 'utf8');
            console.error("Route was created.");
            return true;
        } catch (error) {
            console.error(error);
            return false;
        }

    }
}


// , (err) => {
//     if (err) {
//         this.callback(null, {
//             status: true,
//             message: "cannot create route file."
//         });
//     } else {
//         console.log("Route was created.");
//         this.callback(null, {
//             status: true,
//             message: "route " + this.routeName + " was created."
//         });
//     }

// }