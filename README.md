# crime-report-parser
A parser that converts UMBC Police Crime Report to a more machine-readable format.

##  What is this?
Every month, [UMBC Police](https://police.umbc.edu) publishes their Daily Crime Log which is presumably an automatically generated output from some internal system about the various incidents that were reported to the department.

PDFs are notoriously hard to extract structured data from, with OCR technology sometimes making it even more complicated. This parser does not use OCR, but instead relies on utilizing the position of the various text entities from the PDF file to reconstruct lines.

The plan for this project is to parse the Crime Report archive from UMBC Police and create an endpoint on the UMBC SGA API to allow students to query the data and perform their own analyses on it.

## How to run this program yourself
1. Have `node` and `npm` installed on your development environment.
2. Clone this repository and run `npm install` to install the required packages.
3. Run `node parser.js` to run the parser program or `node analyzer.js` to run the analyzer program.

## Do I need to run it myself?
No, you don't have to because the outputs are already stored in this repository, and they will also eventually be on the UMBC SGA API, but perhaps you have older files that are no longer listed on the UMBC Police website, or have an idea of how to improve the parser. Contributions are always welcome!
