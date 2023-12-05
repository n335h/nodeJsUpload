const express = require('express');
const fileUpload = require('express-fileupload');
const path = require('path');
const fs = require('fs');

const filesPayloadExists = require('./middleware/filesPayloadExist');
const fileExtLimiter = require('./middleware/fileExtLimiter');
const fileSizeLimiter = require('./middleware/fileSizeLimiter');

const PORT = process.env.PORT || 3000;
const app = express();

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/upload', fileUpload({ createParentPath: true }),
    filesPayloadExists,
    fileExtLimiter(['.pdf', '.docx', '.txt']),
    fileSizeLimiter,
    (req, res) => {
        const files = req.files;
        console.log(files);

        const fileNames = Object.keys(files).map(key => {
            const filepath = path.join(__dirname, 'files', files[key].name);
            files[key].mv(filepath, (err) => {
                if (err) return res.status(500).json({ status: "error", message: err });
            });
            return files[key].name;
        });

        return res.json({ status: 'files uploaded successfully', message: fileNames });
    }
);

app.get('/files', (req, res) => {
    const files = fs.readdirSync(path.join(__dirname, 'files'));
    return res.json({ status: 'success', message: files });
});

app.get('/download/:filename', (req, res) => {
    const filename = req.params.filename;
    const filepath = path.join(__dirname, 'files', filename);

    // Check if the file exists
    if (fs.existsSync(filepath)) {
        // Provide the file for download
        res.download(filepath, filename, (err) => {
            if (err) {
                return res.status(500).json({ status: 'error', message: 'Error downloading file' });
            }
        });
    } else {
        return res.status(404).json({ status: 'error', message: `File ${filename} not found` });
    }
});

app.delete('/delete/:filename', (req, res) => {
    const filename = req.params.filename;
    const filepath = path.join(__dirname, 'files', filename);

    if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
        return res.json({ status: 'success', message: `File ${filename} deleted successfully` });
    } else {
        return res.status(404).json({ status: 'error', message: `File ${filename} not found` });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
