var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');

router.get('/checkLogin', function(req, res, next) {
  if(req.session.username){
    res.send(req.session.username);
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
          supervisorPwObj['username'] = value;
          studentPwObj['username'] = value;
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
    var group_info_collection = db.get("GroupInfo");
    group_info_collection.insert(objArray, function(error){
      if(error == null){
        console.log("Successfully inserted records into GroupInfo");

        //insert passwordObjArray into the User collection
        var user_collection = db.get("User");
        user_collection.insert(passwordObjArray, function(error){
          if(error == null){
            console.log("Successfully inserted records into User");
            res.send(null);
          }  else {
            res.send(error);
          }
        });

      } else {
        res.send(error);
      }
    });
  });


});

router.delete('/clearData', function(req, res, next){
  let db = req.db;
  //removed all records in GroupInfo
  var group_info_collection = db.get("GroupInfo");
  group_info_collection.remove({}, function(error){
    if(error == null){
      console.log("Successfully removed records in GroupInfo");
    } else {
      res.send(error);
    }
  });

  //remove all records in User
  var user_collection = db.get("User");
  user_collection.remove({}, function(error){
    if(error == null){
      console.log("Successfully removed records in User");

      //add back admin record into the User collection
      user_collection.insert({"username":"admin", "password":"admin", "type":"admin"}, function(error){
        if(error == null){
          console.log("Successfully inserted admin back to User");
          res.send(null);
        } else {
          res.send(error);
        }
      });
    } else {
      res.send(error);
    }
  });

});

//helper functions
function genRandomPassword(){
  let numberOfDigits = 8;
  let multiplier = 1;
  for(let cnt = 1; cnt < numberOfDigits; cnt++){
      multiplier *= 10;
  }
  let randPW = Math.floor(Math.random() * multiplier);
  while(randPW < multiplier){
      randPW *= 10;
  }
  return randPW;
}

module.exports = router;
