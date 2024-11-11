const fs = require('fs');
const pdf = require('pdf-parse');

async function parseWithOptions(pdfPath, options = {}) {
    try {
        const dataBuffer = fs.readFileSync(pdfPath);
        
        // Custom options
        const parseOptions = {
            pagerender: function(pageData) {
                const renderOptions = {
                    normalizeWhitespace: false,
                    disableCombineTextItems: false
                };
                
                return pageData.getTextContent(renderOptions)
                    .then(function(textContent) {
                        let lastY, text = '';
                        for (let item of textContent.items) {
                            if (lastY != item.transform[5] && lastY !== undefined) {
                                text += '\n';
                            }
                            text += item.str;
                            if (item.hasEOL) {
                                text += '\n';
                            }
                            lastY = item.transform[5];
                        }
                        return text;
                    });
                }
            }

        const data = await pdf(dataBuffer, parseOptions);
        
        return {
            text: data.text,
            pages: data.numpages,
            info: data.info,
            metadata: data.metadata,
            version: data.version
        };
    } catch (error) {
        console.error('Error parsing PDF:', error);
        throw error;
    }
}

// Example usage with options
async function example() {
    const options = {
        pages: [1, 2],              // Only parse first two pages
        maxPages: 2,                // Maximum pages to parse
        preserveSpaces: true,       // Preserve original spaces
        normalizeWhitespace: true,  // Normalize whitespace
        disableCombineTextItems: false
    };

    try {
        const result = await parseWithOptions('./example.pdf', options);
        console.log('Parsed content:', result);
    } catch (error) {
        console.error('Failed to parse PDF:', error);
    }
}

module.exports = { parseWithOptions }; 