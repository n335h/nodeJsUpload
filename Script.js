const form =
	document.getElementById('uploadForm');
const fileList =
	document.getElementById('fileList');
const currentFilesList = document.getElementById(
	'currentFilesList'
);
const searchBar =
	document.getElementById('searchBar');
const sortDropdown = document.getElementById(
	'sortDropdown'
);
const loginScreen = document.getElementById(
	'loginScreen'
);
const fileUploadForms = document.getElementById(
	'fileUploadForms'
);

let currentSort = 'alphabetical'; // Default sorting method
let currentFolderPath = '/files';
///////////////Dummy Login
function login() {
	const isLoggedIn = true; // Replace with your actual authentication check

	if (isLoggedIn) {
		loginScreen.classList.add('hidden');
		fileUploadForms.classList.remove('hidden');
	}
}

//////////////////////////// Is Folder?
const isFolder = (item) => {
	return !item.includes('.');
};

////////////////////// Handle Item click
const handleItemClick = async (
	name,
	isFolder
) => {
	if (isFolder) {
		try {
			const response = await fetch(
				`http://localhost:3000/files/${encodeURIComponent(
					currentFolderPath + name
				)}`
			);
			if (!response.ok) {
				throw new Error(
					`Failed to fetch folder contents: ${name}`
				);
			}

			const data = await response.json();

			// Update currentFolderPath
			currentFolderPath = decodeURIComponent(
				`${currentFolderPath}${name}/`
			);

			// Display files in the new current folder path
			await displayCurrentFiles();
			console.log(displayCurrentFiles);
		} catch (error) {
			console.error(
				`Error fetching folder contents ${name}:`,
				error
			);
		}
	} else {
		// If the item is a file, preview it
		previewFile(name);
	}
};

const previewFile = async (filename) => {
	try {
		const response = await fetch(
			`http://localhost:3000/files/${encodeURIComponent(
				filename
			)}`
		);
		console.log(response);

		if (!response.ok) {
			throw new Error(
				`Failed to fetch file: ${filename}. Status: ${response.status}`
			);
		}

		const fileContent = await response.text();

		// Display the file content in the overlay/modal
		document.getElementById(
			'filePreviewContent'
		).innerText = fileContent;

		// Show the overlay/modal
		document
			.getElementById('filePreviewOverlay')
			.classList.remove('hidden');
	} catch (error) {
		console.error(
			`Error previewing file ${filename}:`,
			error
		);
		alert(
			`Error previewing file ${filename}: ${error.message}`
		);
	}
};

// Function to navigate back to the previous folder
const navigateBack = async () => {
	// Check if the currentFolderPath is already at the root level
	if (currentFolderPath === '/') {
		alert('Already at the root level.');
		return;
	}

	// Remove the last folder from the currentFolderPath
	const folders = currentFolderPath
		.split('/')
		.filter(Boolean); // Remove empty strings
	folders.pop(); // Remove the last folder

	// Construct the new currentFolderPath
	currentFolderPath = `/${folders.join('/')}`;

	// Display files in the new current folder path
	await displayCurrentFiles();
};

/////////////// File Upload

document
	.getElementById('myFiles')
	.addEventListener('change', () => {
		const myFiles =
			document.getElementById('myFiles').files;
		fileList.innerHTML = Array.from(myFiles)
			.map((file) => `<li>${file.name}</li>`)
			.join('');
	});

/////////////// Send Files

const sendFiles = async () => {
	fileList.classList.add('upload-animation');
	const currentFolderPathInput =
		document.getElementById(
			'currentFolderPathInput'
		);
	currentFolderPathInput.value =
		currentFolderPath;

	const myFiles =
		document.getElementById('myFiles').files;
	const uploadingSymbol =
		'<span class="loading-symbol">Uploading...</span>';

	fileList.innerHTML = Array.from(myFiles)
		.map(
			(file) =>
				`<li>${file.name} ${uploadingSymbol}</li>`
		)
		.join('');

	const formData = new FormData();

	console.log(
		'Current Folder Path:',
		currentFolderPath
	);
	Object.keys(myFiles).forEach((key) => {
		// Append the file to the form data with the folder path
		formData.append(
			`${currentFolderPath}${
				myFiles.item(key).name
			}`,
			myFiles.item(key)
		);
	});

	try {
		const response = await fetch(
			'http://localhost:3000/upload',
			{
				method: 'POST',
				body: formData,
			}
		);

		const json = await response.json();
		console.log(json);

		const h2 = document.querySelector('h2');
		h2.textContent = `Status: ${json?.status}`;

		const filesList = json?.message;
		fileList.innerHTML = filesList
			.map((file) => `<li>${file}</li>`)
			.join('');

		setTimeout(() => {
			fileList.classList.remove(
				'upload-animation'
			);

			////////////////////// Remove the uploaded files from the list
			Array.from(myFiles).forEach((file) => {
				const uploadedFileElement = Array.from(
					fileList.children
				).find((li) =>
					li.textContent.includes(file.name)
				);
				if (uploadedFileElement) {
					uploadedFileElement.remove();
				}
			});

			/////////////////////// Reset the value of the file input to clear the selection
			document.getElementById('myFiles').value =
				'';
		}, 2000);
		console.log(json);
	} catch (error) {
		console.error(
			'Error during file upload:',
			error
		);
		fileList.innerHTML = Array.from(myFiles)
			.map(
				(file) =>
					`<li>${file.name} - Upload failed</li>`
			)
			.join('');
	}
};

form.addEventListener('submit', async (e) => {
	e.preventDefault();
	await sendFiles();
	await displayCurrentFiles();
});

/////////////////// Create New Folder

function createNewFolder() {
	const folderName = prompt(
		'Please enter a folder name',
		'New Folder'
	);

	if (folderName !== null) {
		const response = fetch(
			'http://localhost:3000/create-folder',
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					folderName,
					currentFolderPath,
				}),
			}
		)
			.then((response) => response.json())
			.then((data) => {
				console.log(data.message);
				displayCurrentFiles(); // Assuming this function displays the current files
			})
			.catch((error) =>
				console.error('Error:', error)
			);
	}
}
///////////////// File Delete

function ConfirmDelete() {
	return confirm(
		'Are you sure you want to delete?'
	);
}

const deleteFile = async (filename) => {
	if (ConfirmDelete()) {
		const response = await fetch(
			`http://localhost:3000/delete/${filename}`,
			{
				method: 'DELETE',
			}
		);

		const json = await response.json();
		console.log(json);

		await displayCurrentFiles();
	}
};

///////////////// Delete Selected Files

const deleteSelectedFile = async (filename) => {
	const response = await fetch(
		`http://localhost:3000/delete/${filename}`,
		{
			method: 'DELETE',
		}
	);

	/// seperate logic for delete selected files as utilising deleteFile left a loop of delete confirmation popup for each file

	const json = await response.json();
	console.log(json);
};

function deleteSelectedFiles() {
	const selectedCheckboxes =
		document.querySelectorAll(
			'.file-checkbox:checked'
		);
	const selectedFileNames = Array.from(
		selectedCheckboxes
	).map((checkbox) => checkbox.dataset.filename);

	if (selectedFileNames.length > 0) {
		if (
			confirm(
				`Are you sure you want to delete ${selectedFileNames.length} selected file(s)?`
			)
		) {
			selectedFileNames.forEach(
				async (filename) => {
					await deleteSelectedFile(filename);
				}
			);

			// Refresh the display after all files are deleted
			displayCurrentFiles();
		}
	} else {
		alert(
			'Please select at least one file to delete.'
		);
	}
}

///////////////// File Download

const downloadFile = async (filename) => {
	try {
		const response = await fetch(
			`http://localhost:3000/download/${filename}`
		);
		if (!response.ok) {
			throw new Error(
				`Failed to download file: ${filename}`
			);
		}
		const blob = await response.blob();
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	} catch (error) {
		console.error(
			`Error downloading file ${filename}:`,
			error
		);
		throw error;
	}
};
///////////////// Download Selected Files

function downloadSelectedFiles() {
	const selectedCheckboxes =
		document.querySelectorAll(
			'.file-checkbox:checked'
		);
	const selectedFileNames = Array.from(
		selectedCheckboxes
	).map((checkbox) => checkbox.dataset.filename);

	if (selectedFileNames.length > 0) {
		// Use a Promise.all to wait for all downloadFile to complete
		Promise.all(
			selectedFileNames.map((filename) =>
				downloadFile(filename)
			)
		)
			.then(() => {
				// All downloads completed successfully

				// Unchecking the checkboxes for the downloaded files
				selectedCheckboxes.forEach((checkbox) => {
					checkbox.checked = false;
				});

				console.log(
					'All files downloaded successfully'
				);
			})
			.catch((error) => {
				// Handle any errors that occurred during the downloads
				console.error(
					'Error downloading files:',
					error
				);
			});
	} else {
		alert(
			'Please select at least one file to download.'
		);
	}
}

///////////////// Display Current Files
const displayCurrentFiles = async () => {
	try {
		console.log('Fetching files from server...');
		console.log(
			'Before fetch, currentFolderPath:',
			currentFolderPath
		);

		const response = await fetch(
			`http://localhost:3000/files${currentFolderPath}`
		);
		const json = await response.json();
		console.log('Server Response:', json);
		console.log(
			'After fetch, currentFolderPath:',
			currentFolderPath
		);

		let currentFiles = [];

		// Check the structure of the JSON response
		if (json.message) {
			// If JSON.message exists, use it
			currentFiles = json.message || [];
		} else if (json.files) {
			// If JSON.files exists, use it
			currentFiles = json.files || [];
		}

		console.log('Current Files:', currentFiles);

		const filteredFiles = currentFiles.filter(
			(file) =>
				file
					.toLowerCase()
					.includes(searchBar.value.toLowerCase())
		);

		if (currentSort === 'alphabetical') {
			filteredFiles.sort();
		} else if (currentSort === 'uploadDate') {
			filteredFiles.sort((a, b) => {
				const timestampA = Date.parse(
					a.timestamp
				);
				const timestampB = Date.parse(
					b.timestamp
				);
				return timestampB - timestampA;
			});
		}

		const currentFilesListContainer =
			document.getElementById('currentFilesList');

		// Debug: Log the filteredFiles array
		console.log('Filtered Files:', filteredFiles);

		// Debug: Log the HTML being generated
		const generatedHTML = filteredFiles
			.map((file) => `...`)
			.join('');
		console.log('Generated HTML:', generatedHTML);

		const headerRow = `
    <div class="header-container">
             <button id="backButton" onclick="navigateBack()">Back</button>
        <div class="flex sticky justify-between items-center font-bold text-gray-800">
            <span class="w-2/3">Filename</span>
            <span class="w-1/3">Date Added</span>
        </div>
        <hr class="my-2 mr-4 border-t border-gray-200">
    </div>
`;

		// Display header and files
		const filesHTML = filteredFiles
			.map(
				(file) => `
    <div class="currentFilesList flex justify-between items-center">
   
        <span class="flex w-5/6 items-center">
            <input type="checkbox" class="file-checkbox h-2.5 w-2.5 mr-4" data-filename="${file}" />
            <span class="flex w-2/3" onclick="handleItemClick('${file}', ${isFolder(
					file
				)})">
                ${
									isFolder(file)
										? '<img src="https://img.icons8.com/?size=256&id=67363&format=png" alt="Folder" class="icon h-5 w-5 mr-2">'
										: '<img src="https://img.icons8.com/?size=256&id=qqACFoTWsxHZ&format=png" alt="File" class="icon h-5 w-5 mr-2">'
								}
                ${file}
                <button onclick="renameFileOrFolder('${file}')" class="rename-button ml-2 mr-4">
                    <img class='h-2 w-2' src="https://cdn-icons-png.flaticon.com/512/1159/1159633.png"/>
                </button>
            </span>
        </span>
        <div class="flex w-1/6">
            <button onclick="deleteFile('${file}')" class="delete-button ml-2 mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="15" height="15" viewBox="0 0 48 48">
                    <path fill="#F44336" d="M21.5 4.5H26.501V43.5H21.5z" transform="rotate(45.001 24 24)"></path>
                    <path fill="#F44336" d="M21.5 4.5H26.5V43.501H21.5z" transform="rotate(135.008 24 24)"></path>
                </svg>
            </button>
            <button onclick="downloadFile('${file}')" class="download-button ml-2 mr-4">
                <img src="https://cdn-icons-png.flaticon.com/512/4208/4208397.png"/>
            </button>
        </div>
    </div>
    <hr class="my-2 mr-4 border-t border-gray-200">
`
			)
			.join('');

		currentFilesListContainer.innerHTML =
			headerRow + filesHTML;
	} catch (error) {
		console.error(
			`Error displaying current files: ${error}`
		);
	}
};
///////////////// Event Listeners for Search Bar and Sort Dropdown

searchBar.addEventListener(
	'input',
	displayCurrentFiles
);
sortDropdown.addEventListener('change', () => {
	currentSort = sortDropdown.value;
	displayCurrentFiles();
});

//////////////////////////// Rename File or Folder
function renameFileOrFolder(name) {
	const newName = prompt(
		`Enter a new name for ${name}`,
		name
	);

	if (newName !== null) {
		const isFolder = name.includes('.');

		if (isFolder) {
			renameFolder(name, newName);
		} else {
			renameFile(name, newName);
		}
	}
}

// Helper function to get the file extension
function getFileExtension(fileName) {
	return fileName.split('.').pop();
}

///////////////// Rename File or Folder

async function renameFile(oldName, newName) {
	try {
		const extension = getFileExtension(oldName);

		const response = await fetch(
			`http://localhost:3000/rename/${oldName}`,
			{
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					newFilename: newName,
				}),
			}
		);

		const json = await response.json();
		console.log(json);

		// Reapply the extension to the new name
		const newFileNameWithExtension = `${newName}.${extension}`;

		await displayCurrentFiles();
	} catch (error) {
		console.error(
			`Error renaming file ${oldName}:`,
			error
		);
	}
}

async function renameFolder(oldName, newName) {
	try {
		const response = await fetch(
			`http://localhost:3000/rename-folder/${oldName}`,
			{
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					newFolderName: newName,
				}),
			}
		);

		const json = await response.json();
		console.log(json);

		await displayCurrentFiles();
	} catch (error) {
		console.error(
			`Error renaming folder ${oldName}:`,
			error
		);
	}
}

function renameSelectedFiles() {
	const selectedCheckboxes =
		document.querySelectorAll(
			'.file-checkbox:checked'
		);
	const selectedFileNames = Array.from(
		selectedCheckboxes
	).map((checkbox) => checkbox.dataset.filename);

	if (selectedFileNames.length === 1) {
		// If only one file is selected, prompt for the new name
		const oldName = selectedFileNames[0];
		renameFileOrFolder(oldName);
	} else {
		alert(
			'Please select exactly one file or folder to rename.'
		);
	}
}

///////////////// Display Current Files on Page Load

window.onload = async () => {
	// Set currentFolderPath to the root directory
	currentFolderPath = '/';

	// Display files in the root directory
	await displayCurrentFiles();
};
