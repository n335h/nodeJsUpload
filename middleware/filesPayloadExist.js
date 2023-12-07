const filesPayLoadExist = (req, res, next) => {
  if (!req.files)
    return res
      .status(400)
      .json({
        status: 'error',
        message: 'No files were uploaded.',
      });

  next();
};

module.exports = filesPayLoadExist;
