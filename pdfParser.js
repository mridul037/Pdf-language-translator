const fs = require('fs');
const pdf = require('pdf-parse');

async function parsePDF(pdfPath) {
    try {
        // Read the PDF file
        const dataBuffer = fs.readFileSync(pdfPath);
        const options = {
            password: "mriduL@37",
            // Additional options can be added here
            max: 0,    // 0 = unlimited pages
            version: 'v2.0.550'
        };
        // Parse the PDF content
        const data = await pdf(dataBuffer,options);

        // Return parsed data
        return {
            text: data.text,         // Raw text content
            pages: data.numpages,    // Number of pages
            info: data.info,         // PDF metadata
            metadata: data.metadata, // PDF metadata
            version: data.version    // PDF version
        };
    } catch (error) {
        console.error('Error parsing PDF:', error);
        throw error;
    }
}

// Example usage
async function main() {
    try {
        const result = await parsePDF('./example.pdf');
        console.log('Number of pages:', result.pages);
        console.log('PDF text:', result.text);
        console.log('PDF info:', result.info);
    } catch (error) {
        console.error('Failed to parse PDF:', error);
    }
}

module.exports = { parsePDF };

// Uncomment to run the example
// main(); 