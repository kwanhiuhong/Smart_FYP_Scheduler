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
        req.session.username = undefined;
        res.send("");
      } else if (user[0].password != password) {
        req.session.username = undefined;
        res.send("Incorrect password");
      } else {
        req.session.username = user[0].username;
        res.send(true);
      }
    } else{
      console.log("Some error occurs in login function, see: " + error);
    }
  });

});

module.exports = router;
