// import filesystem module
const fs = require("fs");

const fileContents = fs.readFileSync("output/01-2020.json", "utf8");
const data = JSON.parse(fileContents);

console.log(groupBy(data, "incidentSubClass"));

/**
 * Group an array of objects by a key.
 * @param {Object[]} obj 
 * @param {String} key 
 * @return {Object} groupedObj
 */
function groupBy(obj, key) {
    return obj.reduce((groupedObj, item) => {
        (groupedObj[item[key]] = groupedObj[item[key]] || []).push(item);
        return groupedObj;
    }, {});
};