var express = require('express');
var router = express.Router();

router.get('/login', function(req, res, next) {
  let username = req.query.username;
  let password = req.query.password;

  let db = req.db;
  let login_info = db.get("User");

  login_info.find({"username":username}, function(error, user){
    console.log(user);
    if (error === null){
      if(user.length === 0){
        req.session.userInfo = undefined;
        res.send("");
      } else {
        let passwordRight = false;
        for(let i = 0; i < user.length; ++i){
          if (user[i].password == password) {
            let userInfo = {"username":user[i].username, "type":user[i].type};
            passwordRight = true;
            req.session.userInfo = userInfo;
            res.send(userInfo);
            break;
          }
        }
        if(!passwordRight){
          req.session.userInfo = undefined;
          res.send("Incorrect password");
        }
      }
    } else{
      console.log("Some error occurs in login function, see: " + error);
    }
  });

});

module.exports = router;
