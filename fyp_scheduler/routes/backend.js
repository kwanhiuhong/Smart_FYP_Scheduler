var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/backend', function(req, res, next) {
  res.send('this is backend.js');
});

module.exports = router;
