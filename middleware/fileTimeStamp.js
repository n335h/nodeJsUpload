const fs = require('fs').promises;
const path = require('path');

const fileTimeStamp = async (req, res, next) => {
  try {
    const filepath = path.join(
      __dirname,
      '../files',
      'files.json'
    );

    // Read the file asynchronously and parse the JSON data
    const files = await fs.readFile(
      filepath,
      'utf-8'
    );
    const filesJson = JSON.parse(files);

    // Add timestamp to the JSON data and push it to the array
    filesJson.push({
      name: req.files.file.name,
      size: req.files.file.size,
      timestamp: Date.now(),
    });

    // Write the modified JSON back to the file asynchronously
    await fs.writeFile(
      filepath,
      JSON.stringify(filesJson)
    );

    next();
  } catch (error) {
    // Handle errors appropriately
    console.error(
      'Error in fileTimeStamp middleware:',
      error
    );
    res
      .status(500)
      .json({
        status: 'error',
        message: 'Internal Server Error',
      });
  }
};

exports.fileTimeStamp = fileTimeStamp;
