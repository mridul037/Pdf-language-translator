const express = require('express');
const multer = require('multer');
const path = require('path');
const Together = require('together-ai');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const { parseWithOptions } = require('./advancedPdfParser');

const app = express();

// Configure multer for PDF uploads
const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    }
});

const upload = multer({ storage: storage });

// Initialize Together AI
const together = new Together({
    apiKey: "your-api-key", 
});

app.use(express.static('public'));
app.use(express.json());


async function translateInChunks(text, language) {
    const paragraphs = text.split(/\n\s*\n/);
    let chunks = [];
    let currentChunk = '';

    for (const paragraph of paragraphs) {
        if ((currentChunk + paragraph).length > 4000 && currentChunk) {
            chunks.push(currentChunk);
            currentChunk = paragraph;
        } else {
            currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
        }
    }
    if (currentChunk) {
        chunks.push(currentChunk);
    }
   console.log(" started translating");
    const translatedChunks = await Promise.all(
        chunks.map(async (chunk, index) => {
            // Add delay between chunks to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, index * 100));

            const message = [
                {
                    role: "system",
                    content: "You are a translator. Translate the text while preserving formatting and special characters.",
                },
                {
                    role: "user",
                    content: `Translate this text to ${language}:\n${chunk}`
                }
            ];

            const stream = await together.chat.completions.create({
                model: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
                messages: message,
                stream: true,
                max_tokens: 2000,
                temperature: 0.7,
            });

            let translatedChunk = "";
            for await (const chunk of stream) {
                translatedChunk += chunk.choices[0]?.delta?.content || "";
            }
            return translatedChunk;
        })
    );


    return translatedChunks.join('\n\n');
}

// Endpoint to handle PDF upload and translation
app.post('/process-pdf', upload.single('pdf'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No PDF file uploaded' });
        }

        const language = req.body.language || 'Hindi';
        
        // Parse PDF
        const pdfResult = await parseWithOptions(req.file.path, {
            preserveFormatting: true,
            maintainSpacing: true 
        });
        fs.unlink(req.file.path, (err) => {
            if (err) console.error('Error deleting uploaded file:', err);
        });

       
        const translatedText = await translateInChunks(pdfResult.text, language);
        // Prepare message for translation
    
        res.json({
            originalText: pdfResult.text,
            translatedText: translatedText
        });

    } catch (error) {
        console.error('Error processing PDF:', error);
        res.status(500).json({ error: error.message });
    }
});




const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
