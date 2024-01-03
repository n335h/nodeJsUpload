////////////////////////// Import modules
const express = require('express');
const fileUpload = require('express-fileupload');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
const { promisify } = require('util');

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

///////////////////////////// Get current file/ folder paddingRight:
app.get('/current-folder', (req, res) => {
	const currentFolderPath = req.query.path || '/';
	const folderPath = path.join(
		__dirname,
		'files',
		currentFolderPath
	);

	if (!fs.existsSync(folderPath)) {
		return res.status(404).json({
			status: 'error',
			message: `Folder ${currentFolderPath} not found`,
		});
	}

	const files = fs.readdirSync(folderPath);

	return res.json({
		status: 'success',
		folder: currentFolderPath,
		files: files,
	});
});
///////////////////////////// Create a new folder
app.post('/create-folder', (req, res) => {
	const folderName = req.body.folderName;
	const currentFolderPath =
		req.body.currentFolderPath || '/';

	if (!folderName) {
		return res.status(400).json({
			status: 'error',
			message: 'Folder name is required',
		});
	}

	const folderPath = path.join(
		__dirname,
		'files',
		currentFolderPath,
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
	async (req, res) => {
		const files = req.files;

		// Get the current folder path from the request body
		const currentFolderPath =
			req.body.currentFolderPath || '/'; //

		console.log(files);

		const fileNames = await Promise.all(
			Object.keys(files).map(async (key) => {
				const filepath = path.join(
					__dirname,
					'files',
					currentFolderPath,
					files[key].name
				);

				// Use promisify to make `mv` function return a promise
				const mvAsync = promisify(files[key].mv);

				try {
					await mvAsync(filepath);
					return files[key].name;
				} catch (error) {
					throw new Error(
						`Error moving file: ${error}`
					);
				}
			})
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

app.get(
	'/download/:folderName/:filename',
	(req, res) => {
		const folderName = req.params.folderName;
		const filename = req.params.filename;
		const folderPath = path.join(
			__dirname,
			'files',
			folderName
		);
		const filePath = path.join(
			folderPath,
			filename
		);

		// Check if the file exists
		if (fs.existsSync(filePath)) {
			// Provide the file for download
			res.download(filePath, filename, (err) => {
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
				message: `File ${filename} not found in folder ${folderName}`,
			});
		}
	}
);

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
			req.body.currentFolderPath || '',
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

////////////////////////// File preview
app.get(
	'/preview/:filename',
	async (req, res) => {
		try {
			const filename = req.params.filename;
			const filePath = path.join(
				__dirname,
				'files',
				filename
			); // Adjust the folder path

			console.log(filePath);
			console.log(fs.existsSync(filePath));

			// Read the content of the file
			const fileContent = fs.readFileSync(
				filePath,
				'utf-8'
			);

			// Send the content as the response
			res.send(fileContent);
		} catch (error) {
			console.error('Error reading file:', error);
			res.status(500).send('Error reading file');
		}
	}
);

////////////////////////// Error handling
app.listen(PORT, () =>
	console.log(`Server running on port ${PORT}`)
);
