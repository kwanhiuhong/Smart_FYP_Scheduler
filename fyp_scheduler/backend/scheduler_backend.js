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
    let dbTimeCollection = db.get("PresentationTime");
    dbTimeCollection.find({},function(error, timeslotRecords){
      if(error == null){
        res.send(timeslotRecords);
      } else {
        res.send([]);
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
    let dbTimeCollection = db.get("PresentationTime");

    dbTimeCollection.find({'startTime':startTime},function(error, timeslotRecords){
      if (timeslotRecords.length == 0){
        dbTimeCollection.insert({'startTime': startTime, 'records':[newRecord]}, function(err){
          if(error == null){
            console.log("Successfully inserted records into PresentationTime");
            res.send("Success");
          } else {
            res.send(error);
          }
        });
      } else {
        let updatedRecords = timeslotRecords["records"].push(newRecord);
        dbTimeCollection.update({'startTime': startTime}, {$set: {"records": updatedRecords}}, function(err){
          if(error == null){
            console.log("Successfully updated records in PresentationTime");
            res.send("Success");
          } else {
            res.send(error);
          }
        });
      }
    });
  }
});

module.exports = router;
