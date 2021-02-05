# crime-report-parser
A parser that converts UMBC Police Crime Report to a more machine-readable format.

##  What is this?
Every month, [UMBC Police](https://police.umbc.edu) publishes their Daily Crime Log which is presumably an automatically generated output from some internal system about the various incidents that were reported to the department.

PDFs are notoriously hard to extract structured data from, with OCR technology sometimes making it even more complicated. This parser does not use OCR, but instead relies on utilizing the position of the various text entities from the PDF file to reconstruct lines.
