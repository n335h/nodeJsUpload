const MB = 5; // 5MB
const FILE_SIZE_LIMIT = MB * 1024 * 1024;

const filesSizeLimiter = (req, res, next) => {
  const files = req.files;

  const filesOverLimit = [];
  //determing whivch files are over the limit
  Object.keys(files).forEach((key) => {
    if (files[key].size > FILE_SIZE_LIMIT) {
      filesOverLimit.pus(files[key].name);
    }
  });

  if (filesOverLimit.length) {
    // if filesOverLimit.length > 1, properVerb = 'are', else properVerb = 'is'
    const properVerb =
      filesOverLimit.length > 1 ? 'are' : 'is';

    const sentence =
      `Upload failed. ${filesOverLimit.toString()} ${properVerb} over the file size limit of ${MB} MB.`.replaceAll(
        ',',
        ', '
      );

    const message =
      filesOverLimit.length < 3
        ? // if filesOverLimit.length < 3, replace the first comma with 'and'
          sentence.replace(',', ' and')
        : // else replace the last comma with 'and'
          sentence.replace(/,(?=[^,]*$)/, ' and');

    return res
      .status(413)
      .json({ status: 'error', message });
  }

  next();
};

// export the middleware
module.exports = filesSizeLimiter;
