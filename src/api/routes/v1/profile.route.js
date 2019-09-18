const express = require('express');
const validate = require('express-validation');
const controller = require('../../controllers/profile.controller');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'upload/' });

router.route('/')
  .get(controller.index);

router.route('/find')
  .post(controller.list);

router.route('/csv_upload')
  .post(upload.single('file'), controller.csv_upload);


module.exports = router;