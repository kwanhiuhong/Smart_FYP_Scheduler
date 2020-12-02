var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');

var maxGrpsForOneSlot = 2;
var presentationMinutes = 20;

/* GET users listing. */
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

router.put('/confirmATimeslot', bodyParser.json(), function(req, res, next){
  if(!req.session.userInfo){
    res.send("No login session found");
  } else {
    let username = req.session.userInfo['username'];
    let schedulerConfigs = req.body;
    console.log("Now printing scheduler configs");
    console.log(schedulerConfigs);
    console.log(typeof(schedulerConfigs.initDate));

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
            let fullSlots = getFullSlots(confirmedSlots, maxNoOfGrpsInEachSlot);
            let notFullSlots = getUnfullSlots(confirmedSlots, maxNoOfGrpsInEachSlot);
            
            if (confirmedSlots.length > 0){
              let confirmedTime = new Date (confirmedSlots[0]["startTime"]);
              res.send("Group " + username + " already has confirmed timeslot in " + confirmedTime + " !")
            } else {
              let flattenedListNotFullSlots = flattenListOfObj(notFullSlots, "startTime");
              console.log("Not full slots");
              console.log(flattenedListNotFullSlots);
              let availableSlots = removeFromList(allPossibleSlots, flattenedListNotFullSlots);
              console.log(availableSlots.length);
              for (let i = 0; i < availableSlots.length; ++i){
                
              }
              //get not full and possible slots
              //then traverse it with loop of unavailable time, if ok break the loop
              //then use that timeslot
              //update db
            }
            // let temp1 = getFullSlots(confirmedTimes, maxNoOfGrpsInEachSlot);
            // let temp2 = getUnfullSlots(confirmedTimes, maxNoOfGrpsInEachSlot);
            // let temp3 = getConfirmedSlot(confirmedTimes, username);

            // console.log("temp1");
            // console.log(temp1);
            // console.log(temp1[0]["records"]);
            // console.log(temp1[0]["records"][0]);
            // console.log("temp2");
            // console.log(temp2);
            // console.log("temp3");
            // console.log(temp3);
            // console.log(flattenListOfObj(temp1, "startTime"));

          } else {
            res.send(error);
          }
        })
      } else {
        res.send(error);
      }
    })
    //confirmed time structure similar to 
    //step 1 goto confirmed time check if this group has confirmed time or not
    //if no, generate the time slot that is allowed to choose
    //this timeslot has a max limit of 2 confirmed slot, and 
    //return an array containing the timeslot that is ok to choose
    //step 2, which should be nested in step 1, goto unavailable time, for each in ok timeslot : 
    //  for each in unavailable time: if unavailable time != oktimeslot -> done!
    //step 3, which should be nested in step 2, go back to confirmed time and update the db
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
          allSlots.push(dateTimeIso);
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
