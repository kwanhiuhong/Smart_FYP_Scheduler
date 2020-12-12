var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');

/* GET users listing. */
router.get('/fetchUserInfo', function(req, res, next){
  if(!req.session.userInfo){
    res.send("No login session found");
  } else {
    res.send(req.session.userInfo);
  }
})

router.get('/fetchEvents', function(req, res, next) {
  if(!req.session.userInfo){
    res.send("No login session found");
  } else {
    let db = req.db;
    let maxNoPerSlot = req.query.maxNoPerSlot;
    let dbUnavailableTime = db.get("UnavailableTime");
    let dbConfirmedTime = db.get("ConfirmedTime");

    let grpNo = req.session.userInfo["username"];
    let usertype = req.session.userInfo["type"];

    let returnedDate = {"sameTypeSlots":[], "differentTypesSlots":[], "confirmedSlot":[], "fullSlots":[]};

    dbUnavailableTime.find({}, function(error, timeslotRecords){
      dbConfirmedTime.find({}, function(err2, confirmedTimeslotRecords){
        if(error == null){
          if(err2 == null){
            
            //this part for gethering sameType and differentTypesSlots
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

            //now we gather full and confirmed slots
            let confirmedSlot = getConfirmedSlot(confirmedTimeslotRecords, grpNo);
            let fullSlots = getFullSlots(confirmedTimeslotRecords, maxNoPerSlot);
            returnedDate["confirmedSlot"] = confirmedSlot;
            returnedDate["fullSlots"] = fullSlots;

            res.send(returnedDate);
          } else {
            res.send(err2);
          }
        } else {
          res.send(error);
        }
      })
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
        let updatedRecords = timeslotRecords[0]["records"];
        updatedRecords.push(newRecord);
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

router.put('/confirmATimeslot', bodyParser.json(), function(req, res, next){
  if(!req.session.userInfo){
    res.send("No login session found");
  } else {
    let username = req.session.userInfo['username'];
    let schedulerConfigs = req.body;

    //retrieve all configs passed in
    let slotDuration = schedulerConfigs.maxPresentationTime;
    let initialDate = new Date(schedulerConfigs.initDate);
    let totalLength = schedulerConfigs.totalLength;
    let endDate = new Date(initialDate);
    endDate.setDate(initialDate.getDate() + totalLength);

    let hiddenDays = schedulerConfigs.hiddenDays;
    let dayStartTime = schedulerConfigs.startDayTime;
    let dayEndTime = schedulerConfigs.endDayTime;
    let maxNoOfGrpsInEachSlot = schedulerConfigs.maxNoOfGrpsInEachSlot;
    let lunchHourStart = schedulerConfigs.lunchHourStart;
    let lunchHourEnd = schedulerConfigs.lunchHourEnd;

    let db = req.db;
    let dbUnavailableTime = db.get("UnavailableTime");
    let dbConfirmedTime = db.get("ConfirmedTime");
    
    dbConfirmedTime.find({}, function(error, confirmedTimes){
      if (error == null){
        dbUnavailableTime.find({}, function(error2, unavailableTimes){
          if (error2 == null){
            let allPossibleSlots = genAllPossibleISOSlots(initialDate, totalLength, hiddenDays,
              dayStartTime, dayEndTime, slotDuration, lunchHourStart, lunchHourEnd);
            
            let confirmedSlots = getConfirmedSlot(confirmedTimes, username);
            let fullSlots = getFullSlots(confirmedTimes, maxNoOfGrpsInEachSlot);
            let notFullSlots = getUnfullSlots(confirmedTimes, maxNoOfGrpsInEachSlot);

            if (confirmedSlots.length > 0){
              let confirmedTime = new Date (confirmedSlots[0]["startTime"]);
              res.send("Group " + username + " already has confirmed timeslot in " + confirmedTime + " !")
            } else {
             
              let flattenedListFullSlots = flattenListOfObj(fullSlots, "startTime");
              let availableSlots = removeFromList(allPossibleSlots, flattenedListFullSlots);
              let unavailableSlots = getUnavailableSlots(unavailableTimes, username);
              let unavailableSlotsList = flattenListOfObj(unavailableSlots, "startTime");

              let foundASlot = false;
              for (let i = 0; i < availableSlots.length; ++i){
                let eachTimeslot = availableSlots[i];
                let goodSlot = true;
                for (let j = 0; j < unavailableSlotsList.length; ++j){
                  if (eachTimeslot == unavailableSlotsList[j]){
                    goodSlot = false;
                    break;
                  }
                }
                if (goodSlot == true){
                  foundASlot = true;
                  //find this slot exists in notfull slots
                  let inNotFullSlots = false;
                  for (let k = 0; k < notFullSlots.length; ++k){
                    let eachNotFullSlot = notFullSlots[k];
                    if (eachNotFullSlot["startTime"] == eachTimeslot){
                      let records = eachNotFullSlot["records"];
                      records.push({"username": username, "confirmed": true});
                      
                      console.log("Before update");
                      dbConfirmedTime.update({'startTime': eachTimeslot}, {$set: {"records": records}}, function(err){
                        if(error == null){
                          console.log("Successfully updated records in confirmedTime");
                          res.send([{"startTime":eachTimeslot, "username": username}]);
                        } else {
                          res.send(error);
                        }
                      });
                      inNotFullSlots = true;
                      break;
                    }
                  }

                  if (!inNotFullSlots){
                    let obj = {'startTime': eachTimeslot, "records": [{"username": username, "confirmed": true}]};
                    
                    console.log("Before insert");
                    dbConfirmedTime.insert(obj, function(err){
                      if(error == null){
                        console.log("Successfully inserted records in confirmedTime");
                        res.send([{"startTime":eachTimeslot, "username": username}]);
                      } else {
                        res.send(error);
                      }
                    });
                  }
                  break;
                }
              }

              if (!foundASlot){
                res.send("Unable to find an appropriate slot!");
              }
            }

          } else {
            res.send(error);
          }
        })
      } else {
        res.send(error);
      }
    })
  }
});

//helper functions
function genAllPossibleISOSlots(initialDate, totalLength, hiddenDays, startTime, endTime, slotDuration, lunchHrStart, lunchHrEnd, isoPerSecond = 1000){
  let allSlots = []
  let initDate = getNewDate(initialDate);
  let isoForInitDate = initDate.getTime()
  let isoOneday = isoPerSecond * 24 * 60 * 60;

  for(let i = 0; i <= totalLength; i++){
    let anotherDateInIso = isoForInitDate + i * isoOneday;
    let anotherDate = new Date(anotherDateInIso);
    if (hiddenDays.includes(anotherDate.getDay())){
      continue;
    } else {
      let dayStartTimeInIso = anotherDateInIso + isoPerSecond * getSeconds(startTime);
      let lunchStartInIso = anotherDateInIso + isoPerSecond * getSeconds(lunchHrStart);
      let lunchEndInIso = anotherDateInIso + isoPerSecond * getSeconds(lunchHrEnd);
      let dayEndTimeInIso = anotherDateInIso + isoPerSecond * getSeconds(endTime);
      let eachSlotInIso = isoPerSecond * getSeconds(slotDuration)
      
      for (let dateTimeIso = dayStartTimeInIso; dateTimeIso <= dayEndTimeInIso - eachSlotInIso; dateTimeIso += eachSlotInIso){
        if (dateTimeIso > lunchStartInIso - eachSlotInIso && dateTimeIso < lunchEndInIso){
          continue;
        } else {
          allSlots.push(dateTimeIso.toString());
        }
      }
    }
  }

  return allSlots;
}

function grpHasConfirmedSlot(){
  let hasConfirmedSlot = false;

  return hasConfirmedSlot;
}

function getUnavailableSlots(unavailableSlotsRecords, grpNo){
  let unavailableSlots = []
  for(let i = 0; i < unavailableSlotsRecords.length; ++i){    
    let eachTimeslotRecord = unavailableSlotsRecords[i];
    let timeSlotInIso = eachTimeslotRecord["startTime"];
    let records = eachTimeslotRecord["records"];

    for (let j = 0; j < records.length; ++j){
      let eachRecord = records[j];
      if (eachRecord["username"] == grpNo){
        let obj = {}
        obj["startTime"] = timeSlotInIso;
        obj["records"] = [{"username": eachRecord["username"], "confirmed": false}];
        unavailableSlots.push(obj);
      }
    }
  }
  return unavailableSlots
}

function getFullSlots(confirmedSlotsRecords, maxNoOfGrpsInEachSlot){
  let fullSlots = []
  for(let i = 0; i < confirmedSlotsRecords.length; ++i){    
    let eachTimeslotRecord = confirmedSlotsRecords[i];
    let timeSlotInIso = eachTimeslotRecord["startTime"];
    let records = eachTimeslotRecord["records"];
    if (records.length == maxNoOfGrpsInEachSlot){
      let obj = {}
      obj["startTime"] = timeSlotInIso;
      obj["records"] = records;
      fullSlots.push(obj);
    }
  }
  return fullSlots
}

function getUnfullSlots(confirmedSlotsRecords, maxNoOfGrpsInEachSlot){
  let notFullSlots = []
  for(let i = 0; i < confirmedSlotsRecords.length; ++i){
    let eachTimeslotRecord = confirmedSlotsRecords[i];
    let timeSlotInIso = eachTimeslotRecord["startTime"];
    let records = eachTimeslotRecord["records"];
    if (records.length < maxNoOfGrpsInEachSlot){
      let obj = {}
      obj["startTime"] = timeSlotInIso;
      obj["records"] = records;
      notFullSlots.push(obj);
    }
  }
  return notFullSlots
}

function getConfirmedSlot(confirmedSlotsRecords, groupNo){
  let listOfObj = []
  for(let i = 0; i < confirmedSlotsRecords.length; ++i){
    let eachTimeslotRecord = confirmedSlotsRecords[i];
    let timeSlotInIso = eachTimeslotRecord["startTime"];
    let records = eachTimeslotRecord["records"];
    for (let j = 0; j < records.length; ++j){
      let eachRecord = records[j];
      if (eachRecord["username"] == groupNo){
        let obj = {}
        obj["startTime"] = timeSlotInIso;
        obj["records"] = [{"username": eachRecord["username"], "confirmed": true}];
        listOfObj.push(obj);
      }
    }
  }
  return listOfObj
}

function flattenListOfObj(listOfObj, key){
  let flattenedList = []
  for (let i = 0; i < listOfObj.length; ++i){
    let eachObj = listOfObj[i];
    if (eachObj.hasOwnProperty(key)){
      flattenedList.push(eachObj[key]);
    }
  }
  return flattenedList;
}

function getAvailbleSlots(allPossibleSlots, confirmedSlotsRecords, maxNoOfGrpsInEachSlot){
  let slotsThatAreNotFull = getUnfullSlots(confirmedSlotsRecords, maxNoOfGrpsInEachSlot);
  return removeFromList(allPossibleSlots, slotsThatAreNotFull);
}

function getNewDate(anotherDate){
  return new Date(anotherDate.getYear()+1900, anotherDate.getMonth(), anotherDate.getDate(), 0, 0, 0);
}

function removeFromList(listA, listB){
  let newList = [];
  for(let i = 0; i < listA.length; i++){
    if(!listB.includes(listA[i])){
      newList.push(listA[i]);
    }
  }
  return newList;
}

function getSeconds(timeString){
  let splittedStr = timeString.split(':');
  let hour = parseInt(splittedStr[0]);
  let minute = parseInt(splittedStr[1]);
  let second = parseInt(splittedStr[2]);
  return hour * 60 * 60 + minute * 60 + second
}

module.exports = router;
