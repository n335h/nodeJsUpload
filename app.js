

////////////////////////// Import modules
const express = require('express');
const fileUpload = require('express-fileupload');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');

////////////////////////// Init app
const PORT = process.env.PORT || 3000;
const app = express();

////////////////////////// Import middlewares
const filesPayloadExists = require('./middleware/filesPayloadExist');
const fileExtLimiter = require('./middleware/fileExtLimiter');
const fileSizeLimiter = require('./middleware/fileSizeLimiter');

app.use(
	bodyParser.urlencoded({ extended: true })
);
app.use(bodyParser.json());

////////////////////////// Set static folder
// Set static folder
app.get('/', (req, res) => {
	res.sendFile(
		path.join(__dirname, 'index.html')
	);
});

///////////////////////////// Create a new folder
app.post('/create-folder', (req, res) => {
	const folderName = req.body.folderName;

	if (!folderName) {
		return res.status(400).json({
			status: 'error',
			message: 'Folder name is required',
		});
	}

	const folderPath = path.join(
		__dirname,
		'files',
		folderName
	);

	if (fs.existsSync(folderPath)) {
		return res.status(400).json({
			status: 'error',
			message: `Folder ${folderName} already exists`,
		});
	}

	fs.mkdirSync(folderPath, { recursive: true });
	return res.json({
		status: 'success',
		message: `Folder ${folderName} created successfully`,
	});
});

//////////////////// Navigate into a folder
app.get('/files/:folderName', (req, res) => {
	const folderName = req.params.folderName;
	const folderPath = path.join(
		__dirname,
		'files',
		folderName
	);

	if (!fs.existsSync(folderPath)) {
		return res.status(404).json({
			status: 'error',
			message: `Folder ${folderName} not found`,
		});
	}

	const files = fs.readdirSync(folderPath);

	return res.json({
		status: 'success',
		folder: folderName,
		files: files,
	});
});

////////////////////////// File upload
app.post(
	'/upload',
	fileUpload({ createParentPath: true }),
	filesPayloadExists,
	fileExtLimiter(['.pdf', '.docx', '.txt']),
	fileSizeLimiter,
	(req, res) => {
		const files = req.files;
		console.log(files);

		const fileNames = Object.keys(files).map(
			(key) => {
				const filepath = path.join(
					__dirname,
					'files',
					files[key].name
				);
				files[key].mv(filepath, (err) => {
					if (err)
						return res.status(500).json({
							status: 'error',
							message: err,
						});
				});
				return files[key].name;
			}
		);

		return res.json({
			status: 'files uploaded successfully',
			message: fileNames,
		});
	}
);

////////////////////////// File download
app.get('/files', (req, res) => {
	const files = fs.readdirSync(
		path.join(__dirname, 'files')
	);
	return res.json({
		status: 'success',
		message: files,
	});
});

app.get('/download/:filename', (req, res) => {
	const filename = req.params.filename;
	const filepath = path.join(
		__dirname,
		'files',
		filename
	);

	// Check if the file exists
	if (fs.existsSync(filepath)) {
		// Provide the file for download
		res.download(filepath, filename, (err) => {
			if (err) {
				return res.status(500).json({
					status: 'error',
					message: 'Error downloading file',
				});
			}
		});
	} else {
		return res.status(404).json({
			status: 'error',
			message: `File ${filename} not found`,
		});
	}
});

////////////////////////// File delete
app.delete('/delete/:filename', (req, res) => {
	const filename = req.params.filename;
	const filepath = path.join(
		__dirname,
		'files',
		filename
	);

	if (fs.existsSync(filepath)) {
		fs.unlinkSync(filepath);
		return res.json({
			status: 'success',
			message: `File ${filename} deleted successfully`,
		});
	} else {
		return res.status(404).json({
			status: 'error',
			message: `File ${filename} not found`,
		});
	}
});

///////////////////// Folder delete

app.delete(
	'/delete-folder/:folderName',
	(req, res) => {
		const folderName = req.params.folderName;
		const folderPath = path.join(
			__dirname,
			'files',
			folderName
		);

		if (fs.existsSync(folderPath)) {
			fs.rmdirSync(folderPath, {
				recursive: true,
			});
			return res.json({
				status: 'success',
				message: `Folder ${folderName} deleted successfully`,
			});
		} else {
			return res.status(404).json({
				status: 'error',
				message: `Folder ${folderName} not found`,
			});
		}
	}
);

////////////////////////// File rename

app.put('/rename/:filename', (req, res) => {
	const filename = req.params.filename;
	const filepath = path.join(
		__dirname,
		'files',
		filename
	);
	const newFilename = req.body.newFilename;
	const newFilepath = path.join(
		__dirname,
		'files',
		newFilename
	);

	if (fs.existsSync(filepath)) {
		fs.renameSync(filepath, newFilepath);
		return res.json({
			status: 'success',
			message: `File ${filename} renamed to ${newFilename} successfully`,
		});
	} else {
		return res.status(404).json({
			status: 'error',
			message: `File ${filename} not found`,
		});
	}
});

////////////////////////// Folder rename

app.put(
	'/rename-folder/:folderName',
	(req, res) => {
		const folderName = req.params.folderName;
		const folderPath = path.join(
			__dirname,
			'files',
			folderName
		);
		const newFolderName = req.body.newFolderName;
		const newFolderPath = path.join(
			__dirname,
			'files',
			newFolderName
		);

		if (fs.existsSync(folderPath)) {
			fs.renameSync(folderPath, newFolderPath);
			return res.json({
				status: 'success',
				message: `Folder ${folderName} renamed to ${newFolderName} successfully`,
			});
		} else {
			return res.status(404).json({
				status: 'error',
				message: `Folder ${folderName} not found`,
			});
		}
	}
);

////////////////////////// Error handling
app.listen(PORT, () =>
	console.log(`Server running on port ${PORT}`)
);
