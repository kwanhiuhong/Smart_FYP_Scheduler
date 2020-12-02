var express = require('express');
var router = express.Router();

var maxGrpsForOneSlot = 2;
var presentationMinutes = 20;

/* GET users listing. */
router.get('/fetchEvents', function(req, res, next) {
  if(!req.session.userInfo){
    res.send("No login session found");
  } else {
    let db = req.db;
    let dbUnavailableTime = db.get("UnavailableTime");
    let grpNo = req.session.userInfo["username"];
    let usertype = req.session.userInfo["type"];

    let returnedDate = {"sameTypeSlots":[], "differentTypesSlots":[], "confirmedSlot":[], "fullSlots":[]};

    dbUnavailableTime.find({},function(error, timeslotRecords){
      if(error == null){
        for (let i = 0; i < timeslotRecords.length; ++i){
          let hasSameType = false, hasDifferentType = false;
          let eachTimeslotRecord = timeslotRecords[i];

          let sameTypeSlot = {}, sameTypeRecords = [];
          let differentTypesSlot = {}, differentTypesRecords = [];

          let startTime = eachTimeslotRecord["startTime"];
          let listOfRecords = eachTimeslotRecord["records"];

          for(let j = 0; j < listOfRecords.length; ++j){
            let eachRecord = listOfRecords[j];

            if(eachRecord["username"] == grpNo){
              if(eachRecord["usertype"] == usertype){
                sameTypeRecords.push(eachRecord);
                hasSameType = true;
              } else if (eachRecord["usertype"] != usertype){
                differentTypesRecords.push(eachRecord);
                hasDifferentType = true;
              }
            }
          }
          
          if(hasSameType){
            sameTypeSlot["startTime"] = startTime;
            sameTypeSlot["records"] = sameTypeRecords;
            returnedDate["sameTypeSlots"].push(sameTypeSlot);
          } else if (hasDifferentType){
            differentTypesSlot["startTime"] = startTime;
            differentTypesSlot["records"] = differentTypesRecords;
            returnedDate["differentTypesSlots"].push(differentTypesSlot);
          }
        }

        res.send(returnedDate);
      } else {
        res.send({});
      }
    });
  }
});

router.get('/insertEvent', function(req, res, next){
  if(!req.session.userInfo){
    res.send("No login session found");
  } else {
    let username = req.session.userInfo['username'];
    let userType = req.session.userInfo['type'];
    let confirmed = false;
    let startTime = req.query.startTime;;
    let reasons = req.query.reasons;
    let newRecord = {"username":username, "usertype": userType, 
                    "confirmed":confirmed, "reasons":reasons}

    let db = req.db;
    let dbUnavailableTime = db.get("UnavailableTime");

    dbUnavailableTime.find({'startTime':startTime},function(error, timeslotRecords){
      if (timeslotRecords.length == 0){
        dbUnavailableTime.insert({'startTime': startTime, 'records':[newRecord]}, function(err){
          if(error == null){
            console.log("Successfully inserted records into UnavailableTime");
            res.send("Success");
          } else {
            res.send(error);
          }
        });
      } else {
        console.log(timeslotRecords);
        let updatedRecords = timeslotRecords[0]["records"].push(newRecord);
        dbUnavailableTime.update({'startTime': startTime}, {$set: {"records": updatedRecords}}, function(err){
          if(error == null){
            console.log("Successfully updated records in UnavailableTime");
            res.send("Success");
          } else {
            res.send(error);
          }
        });
      }
    });
  }
});

router.get('/confirmATimeslot', function(req, res, next){
  if(!req.session.userInfo){
    res.send("No login session found");
  } else {
    let username = req.session.userInfo['username'];
    let userType = req.session.userInfo['type'];
    let confirmed = true;
    let startTime = req.query.startTime;;

    let db = req.db;
    let dbUnavailableTime = db.get("UnavailableTime");
    let dbConfirmedTime = db.get("ConfirmedTime");
    

  }
});

module.exports = router;
