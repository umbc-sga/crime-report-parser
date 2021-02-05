// import PDFExtract module and instantiate an object to access the API
const PDFExtract = require("pdf.js-extract").PDFExtract;
const pdfExtract = new PDFExtract();

// import filesystem module
const fs = require('fs');

/**
 * Parse the crime report PDFs and write to a JSON when this module is executed.
 */
(async function processData() {
    // array of all the input files (crime reports)
    const inputFiles = [
        "input_data/01-2020.pdf",
        "input_data/01-2021.pdf"
    ];

    for (const filepath of inputFiles)
    {
        const filename = filepath.substring(filepath.indexOf("/") + 1);
        
        const data = await getDataFromPDF(filepath);
        
        fs.writeFileSync(`output/${filename.replace("pdf", "json")}`, JSON.stringify(data));
    }
})();

/**
 * Extract the PDF contents of a file.
 * @param {String} filename 
 */
async function getDataFromPDF(filename) {
    // extract PDF contents
    const data = await pdfExtract.extract(filename, {});

    // go through every page in the PDF and reconstruct lines
    const incidentEntries = [];
    for (const page of data.pages) {
        // get the lines of the PDF (lines is an array of line items arrays) by grouping by y-coordinate
        const sortedRawLines = Object.values(fuzzyGroupByYPos(page.content))
            // order lines by y-coordinate in ascending order
            .sort((a, b) => a[0].y - b[0].y)
            // order items within lines by x-coordinate in ascending order
            .map(x => x.sort((a, b) => a.x - b.x));

        // put together line strings
        const reconstructedLines = sortedRawLines
            .map(line => line.reduce((a, b) => a + b.str, ""))
            // chop off the header lines that aren't case data
            .slice(4);

        // remove the last line which lists the incident count
        let state, entry = {
            incident: ""
        };

        for (let i = 0; i < reconstructedLines.length; i++) {
            const line = reconstructedLines[i];

            // get the state depending on what the line starts with
            if (line.startsWith("Date Reported")) state = "reportDate";
            else if (line.startsWith("General Location")) state = "location";
            else if (line.startsWith("Date Occurred From")) state = "timeStart";
            else if (line.startsWith("Date Occurred To")) state = "timeEnd";
            else if (line.startsWith("Incident/Offenses")) state = "incident";
            else if (line.startsWith("Disposition")) state = "disposition";
            else if (line.startsWith("Modified Date")) state = "dateModified";
            // skip processing the summary line at the end of the report
            else if (line.indexOf("incident(s) listed") != -1) break;

            // process a "Report Date:" line
            if (state == "reportDate") {
                entry.reportDate = parseDateLine(line.replace("Date Reported:", ""));
            }
            // process a "General Location:" line
            else if (state == "location") {
                let locationLine = line;
                locationLine = locationLine.replace("General Location:", "");

                const tokens = locationLine.split(" - ");

                entry.location = tokens[0];
                entry.onCampus = tokens.includes("On Campus");
            }
            // process a "Date Occurred From:" line
            else if (state == "timeStart") {
                entry.timeStart = parseDateLine(line.replace("Date Occurred From:", ""));
            }
            // process a "Date Occurred To:" line
            else if (state == "timeEnd") {
                entry.timeEnd = parseDateLine(line.replace("Date Occurred To:", ""));
            }
            // process an "Incident/Offenses:" line
            else if (state == "incident") {
                // append to incident line in case it's multiple lines
                entry.incident += line.replace("Incident/Offenses:", "");
            }
            // process a "Disposition:" line
            else if (state == "disposition") {
                // replace PAT or INV disposition codes
                entry.disposition = properCapitalize(
                    line
                        .replace("Disposition:PAT-", "")
                        .replace("Disposition:inv-", "")
                );
            }
            // process a "Modified Date:" line
            else if (state == "dateModified") {
                entry.dateModified = parseDateLine(line.replace("Modified Date:", ""));

                // add a deep copy of the entry object to the incident entries array
                incidentEntries.push(JSON.parse(JSON.stringify(entry)));

                entry = {
                    incident: ""
                }
            }
        }
    }

    return incidentEntries;

}

/**
 * 
 * @param {String} str 
 * @return {String} properCapitalizedStr
 */
function properCapitalize(str) {
    return str.substring(0, 1).toUpperCase() + str.substring(1).toLowerCase();
}

/**
 * Convert the weird date format from the report into a date in milliseconds.
 * @param {String} line 
 * @return {Number} date
 */
function parseDateLine(line) {
    // get the date
    const date = line.substring(
        // the start of the string after cleaning is the start of the date
        0,
        // target before the first space character as the end of the date
        line.indexOf(" ")
    );

    // delete the date from the line
    line = line.replace(`${date} `, "");

    // get the time
    const time = line.substring(
        // target the at after the week day abbreviation before the time as the start
        line.indexOf(" at") + 4,
        // target the Report text after the time as the end (only applies to certain lines)
        line.indexOf("Report") == -1 ? line.length : line.indexOf("Report")
    );

    return new Date(`${date} ${time}`).getTime();;
}

/**
 * Group an array of items into lines by Y-positions with some tolerance for improper line
 * alignments.
 * @param {Object[]} items
 * @param {Number} tolerance
 * @return {Object} groupedLines
 */
function fuzzyGroupByYPos(items, tolerance=0.3) {
    return items.reduce((linesArray, item) => {
        // get the closest previously recorded y-pos bucket
        // from: https://stackoverflow.com/questions/8584902/get-the-closest-number-out-of-an-array
        const closest = Object.keys(linesArray)
            .reduce((prev, curr) => (Math.abs(curr - item.y) < Math.abs(prev - item.y) ? curr : prev), 0);

        // calculate the difference between the closest line by Y-pos and the current line
        const difference = Math.abs(closest - item.y);
        
        // if the difference is close enough, it is the same line, just improperly aligned
        if (difference < tolerance && difference !== 0)
        {
            linesArray[closest].push(item);
        }
        // otherwise it is a different line
        else
        {
            // from: https://stackoverflow.com/questions/14446511/most-efficient-method-to-groupby-on-an-array-of-objects
            (linesArray[item.y] = linesArray[item.y] || []).push(item);
        }

        return linesArray;
    }, {});
}