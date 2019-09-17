const express = require('express');
const validate = require('express-validation');
const controller = require('../../controllers/profile.controller');
const router = express.Router();

router.route('/')
  .get(controller.index);

router.route('/find')
  .post(controller.list);


module.exports = router;