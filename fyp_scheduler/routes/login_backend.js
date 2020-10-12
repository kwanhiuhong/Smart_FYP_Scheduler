var express = require('express');
var router = express.Router();

router.get('/login', function(req, res, next) {
  let username = req.query.username;
  let password = req.query.password;

  let db = req.db;
  let login_info = db.get("login_info");

  login_info.find({'username':username}, function(error, user){
    if (error === null){

      if(user.length === 0){
        res.send("");
      } else if (user[0].password === password) {
        res.send(true);
      } else {
        res.send("Incorrect password");
      }
    }
  });

});

module.exports = router;
