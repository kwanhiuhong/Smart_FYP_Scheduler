var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');

router.get('/checkLogin', function(req, res, next) {
  if(req.session.userInfo){
    res.send(req.session.userInfo);
  } else {
    res.send("");
  }
});

router.get('/getData', function(req, res, next){
  let db = req.db;
  let groupInfo = db.get("GroupInfo");
  
  groupInfo.find({},{},function(error, records){
    let cleanRecords = [];
    for(let i = 0; i < records.length; i++){
      let obj = records[i];
      delete obj['_id'];
      cleanRecords.push(obj);
    }
    res.send(cleanRecords);
  });

});

router.put('/importData', bodyParser.json(), function(req, res, next){
  if(!req.session.userInfo){
    res.send("No login session found");
  } else if (req.session.userInfo["type"] != "admin") {
    res.send("You are not an admin!");
  } else {
      //this is a object of objects
    var data = req.body;

    //an array of map object
    let mapObjArray = [];

    //an array of plain object
    let objArray = [];

    //an array of object storing each group's supervisor's and student's pw
    let passwordObjArray = [];

    //get the largest group no currently in the database
    let db = req.db;
    let groupInfo = db.get("GroupInfo");
    
    groupInfo.find({},{"sort":"Group No"},function(error, records){
      let length = records.length;
      let maxGroupNo = -1;

      if (length > 0){
        maxGroupNo = parseInt(records[length-1]["Group No"]);
      } 

      console.log("the max group no is "+maxGroupNo);
      let groupNo = maxGroupNo === -1 ? 1 : maxGroupNo + 1;

      //now add three colums, Group No, Supervisor's pw, student's pw into the JSON
      for (const [index, eachRow] of Object.entries(data)) {
        let fyp_team = new Map([['Group No', groupNo++]]);
        let passwords = new Map([
            ['Supervisor\'s password', genRandomPassword()], 
            ['Student\'s password', genRandomPassword()]
        ]);
        let raw_data = new Map(Object.entries(eachRow));
        let map = new Map([...fyp_team, ...raw_data, ...passwords]);
        mapObjArray.push(map);
      }

      //now convert it back to an array of plain object/JSON form
      for (let i = 0; i < mapObjArray.length; i++){
        let obj = {};
        let supervisorPwObj = {};
        let studentPwObj = {};

        for (let [key, value] of mapObjArray[i]) {
          if (key == 'Group No'){
            supervisorPwObj['username'] = value.toString();
            studentPwObj['username'] = value.toString();
          } else if (key == 'Supervisor\'s password'){
            supervisorPwObj['password'] = value;
            supervisorPwObj['type'] = "supervisor";
          } else if (key == 'Student\'s password'){
            studentPwObj['password'] = value;
            studentPwObj['type'] = "student";
          }
          obj[key] = value;
        }

        passwordObjArray.push(supervisorPwObj);
        passwordObjArray.push(studentPwObj);
        objArray.push(obj);
      }

      //insert group info record into the GroupInfo collection
      let group_info_collection = db.get("GroupInfo");
      group_info_collection.insert(objArray, function(error){
        if(error == null){
          console.log("Successfully inserted records into GroupInfo");

          //insert passwordObjArray into the User collection
          let user_collection = db.get("User");
          user_collection.insert(passwordObjArray, function(error){
            if(error == null){
              console.log("Successfully inserted records into User");
              res.send("Success");
            }  else {
              res.send(error);
            }
          });

        } else {
          res.send(error);
        }
      });
    });
  }
});

router.delete('/clearData', function(req, res, next){
  //if not admin, not allowed to clear data
  if(!req.session.userInfo){
    res.send("No login session found");
  } else if (req.session.userInfo["type"] != "admin") {
    res.send("You are not an admin!");
  } else {
    let db = req.db;
    //removed all records in GroupInfo
    let group_info_collection = db.get("GroupInfo");
    group_info_collection.remove({}, function(error){
      if(error == null){
        console.log("Successfully removed records in GroupInfo");
      } else {
        res.send(error);
      }
    });
  
    //remove all records in User
    let user_collection = db.get("User");
    user_collection.remove({}, function(error){
      if(error == null){
        console.log("Successfully removed records in User");
  
        //add back admin record into the User collection
        user_collection.insert({"username":"admin", "password":"admin", "type":"admin"}, function(error){
          if(error == null){
            console.log("Successfully inserted admin back to User");
            res.send("Success");
          } else {
            res.send(error);
          }
        });
      } else {
        res.send(error);
      }
    });
  }
});

//helper functions
function genRandomPassword(){
  let randPW = ''; 
  let str = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' +  
          'abcdefghijklmnopqrstuvwxyz0123456789!'; 
    
  for (i = 1; i <= 8; i++) { 
      let char = Math.floor(Math.random() * str.length + 1);
      randPW += str.charAt(char) 
  } 
    
  return randPW;
}

module.exports = router;
