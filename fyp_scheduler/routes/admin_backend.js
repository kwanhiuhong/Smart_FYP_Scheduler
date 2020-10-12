var express = require('express');
var router = express.Router();

router.get('/admin', function(req, res, next) {

  if(req.session.username){
    res.send(req.session.username);
  } else {
    res.send("");
  }

});

module.exports = router;
