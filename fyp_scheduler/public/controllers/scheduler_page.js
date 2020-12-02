var main_app = angular.module('scheduler', []);

//this is the time allowed for presentation
var schedulerConfigs = {
    //note that in javascript, 0 = Jan, 10 = Nov, 11 = Dec.
    initDate: new Date(2020, 10, 30, 9, 30, 0),
    totalLength: 12,
    maxNoOfGrpsInEachSlot: 2,
    startDayTime: '09:30:00',
    endDayTime: '18:30:00',
    maxPresentationTime: '00:20:00',
    isoNumberPerSecond: 1000,
    hiddenDays: [6, 0], // hide Sat and Sun
    lunchHourStart: '12:30:00',
    lunchHourEnd: '14:30:00'
}

var maxPresentationDuration = getSeconds(schedulerConfigs.maxPresentationTime);
var isoNumberForPresentTime = maxPresentationDuration * schedulerConfigs.isoNumberPerSecond;
var initialDate = schedulerConfigs.initDate;
var endDate = new Date(initialDate);
endDate.setDate(initialDate.getDate() + schedulerConfigs.totalLength);

main_app.controller('scheduler_controller', function($scope, $http){
    var calendarEl = document.getElementById('calendar');

    var calendar = new FullCalendar.Calendar(calendarEl, {
        selectable: false,
        initialView: 'timeGridWeek',
        allDaySlot: false,
        hiddenDays: schedulerConfigs.hiddenDays, 
        slotDuration: schedulerConfigs.maxPresentationTime,
        slotMinTime: schedulerConfigs.startDayTime,
        slotMaxTime: schedulerConfigs.endDayTime,
        initialDate: initialDate,
        validRange: {
            start: initialDate,
            end: endDate
        },
        businessHours: [
            {
                daysOfWeek: [ 1, 2, 3, 4, 5 ],
                startTime: schedulerConfigs.startDayTime, // a start time (10am in this example)
                endTime: schedulerConfigs.lunchHourStart, // an end time (6pm in this example)
            },
            {
                daysOfWeek: [ 1, 2, 3, 4, 5 ],
                startTime: schedulerConfigs.lunchHourEnd, // a start time (10am in this example)
                endTime: schedulerConfigs.endDayTime, 
            }
        ],
        headerToolbar: {
            left: '',
            center: 'title',
            right: 'prev,next',
            //right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        eventClick: function(info) {
            let modalBtn = document.getElementById("modalButton");
            let modalTitle = document.getElementById("modalTitle");
            let modalBody = document.getElementById("modalBody");
            //this info.event._instance.range.start/end treats our calendar as GMT
            //so when it shows HKT, it shows 8 hours later
            //to rescue, we convert it back to GMT.
            let startTime = convertToGMTString(info.event._instance.range.start);
            let endTime = convertToGMTString(info.event._instance.range.end);

            modalTitle.innerHTML = "Info from: " + startTime + " to " + endTime;
            modalBody.innerHTML = info.event.title;
            modalBtn.click();
            // alert(
            //     'Reasons: ' + info.event.title + "\n" + 
            // );
            // change the border color just for fun
            // info.el.style.borderColor = 'red';
        },
        eventMouseEnter: function(info){
            let element = info.el;
            element.setAttribute("title", info.event.title); 
        },
        select: function(info) {
            var nameAndReason = prompt("Please input why you are unable to join this timeslot" 
                + " from "
                + info.start
                + " to " 
                + info.end
                + "\n Enter your name and reason(s):");

            if (nameAndReason != null){
                let isoNumber = Date.parse(info.start);
                $http.get("/insertEvent?startTime="+isoNumber+"&reasons="+nameAndReason).then(function(response){
                    if (response.data === "Success") {
                        (info.view.type.match(/^timeGrid/)) && calendar.unselect(),
                        calendar.addEvent({
                            title: nameAndReason,
                            start: info.start,
                            end: info.end,
                            color: "Cyan", 
                            textColor: "Black"
                        })
                    } else {
                        alert("Fail to add event to calendar, error: " + response.data);
                    } 
                });
            }
        }
    });

    $scope.load = function(){
        $http.get("/fetchEvents?maxNoPerSlot="+schedulerConfigs.maxNoOfGrpsInEachSlot).then(function(response){
            let responseData = response.data;
            if (typeof(responseData) == "string"){
                alert(responseData);
            } else if (typeof(responseData) == "object"){
                if (Object.keys(responseData).length > 0){
                    let eventSources = [];

                    let sameTypeSlotsEvents = responseData["sameTypeSlots"];
                    let differentTypesSlotsEvents = responseData["differentTypesSlots"];
                    let confirmedSlotsEvents = responseData["confirmedSlot"];
                    let fullSlots = responseData["fullSlots"];

                    for (let i = 0; i < confirmedSlotsEvents.length; ++i){
                        let eachConfirmedEvent = confirmedSlotsEvents[i];
                        let confirmedGrp = eachConfirmedEvent["records"][0]["username"];
                        let timeSlot = eachConfirmedEvent["startTime"];
                        for (let j = 0; j < fullSlots.length; ++j){
                            let eachFullEvent = fullSlots[j];
                            if (eachFullEvent["startTime"] == timeSlot){
                                let records = eachFullEvent["records"];
                                for(let k = 0; k < records.length; ++k){
                                    let eachRecord = records[k];
                                    if (eachRecord["username"] == confirmedGrp){
                                        records.splice(k,1);
                                        break;
                                    }
                                }
                                break;
                            }
                        }
                    }
    
                    let sameTypeEventSource = eventCreator(sameTypeSlotsEvents, "Cyan", "black", "Your group - ");
                    let differentTypesEventSource = eventCreator(differentTypesSlotsEvents, "", "black", "Your group - ");
                    let confirmedEventSource = eventCreator(confirmedSlotsEvents, "green", "black", "Your group - ");
                    let fullEventSource = eventCreator(fullSlots, "grey", "black");

                    if (confirmedEventSource.length > 0){
                        eventSources = [...confirmedEventSource, ...fullEventSource];
                    } else {
                        eventSources = [...sameTypeEventSource, ...differentTypesEventSource, ...confirmedEventSource, ...fullEventSource];
                    }

                    calendar.addEventSource(eventSources);
                }
            } else {
                alert(responseData);
            }
        });
        calendar.currentData.options.selectable = true;
        calendar.render();
    };

    $scope.confirmATime = function(){
        alert("testing");
        $http.put("/confirmATimeslot", schedulerConfigs).then(function(response){
            let responseData = response.data;
            if (Object.keys(responseData).length > 0){
                let eventSources = [];

                let sameTypeEventSource = eventCreator(responseData["sameTypeSlots"], "Cyan", "black");
                let differentTypesEventSource = eventCreator(responseData["differentTypesSlots"], "", "black");
                let confirmedEventSource = eventCreator(responseData["confirmedSlot"], "green", "black");
                let fullEventSource = eventCreator(responseData["fullSlots"], "grey", "black");

                if (confirmedEventSource.length > 0){
                    eventSources = [...confirmedEventSource, ...fullEventSource];
                } else {
                    eventSources = [...sameTypeEventSource, ...differentTypesEventSource, ...confirmedEventSource, ...fullEventSource];
                }
                
                calendar.addEventSource(eventSources);
            }
        });
        // calendar.render();

        //after successfully confirm a date, the calendar should rerender
        //and show only the confirmed case.
    }
});

//helper functions
function getSeconds(timeString){
    let splittedStr = timeString.split(':');
    let hour = parseInt(splittedStr[0]);
    let minute = parseInt(splittedStr[1]);
    let second = parseInt(splittedStr[2]);
    return hour * 60 * 60 + minute * 60 + second
}

// function getGMTDate(year, month, day, hour=0, minute=0, second=0){
//     return new Date(Date.UTC(year, month, day, hour, minute, second));
// }

function convertToGMTString(date){
    return date.toLocaleString("en-us", { timeZone: "GMT" });
}

function eventCreator(timeslots, color, textColor, extraText = ""){
    let eventSources = [];
    if (timeslots.length > 0){

        for(let i = 0; i < timeslots.length; ++i){
            let eachEventObj = timeslots[i];
            let startTime = parseInt(eachEventObj["startTime"]);
            let endTime = startTime + isoNumberForPresentTime;
            
            for(let j = 0; j < eachEventObj["records"].length; ++j){
                let content = "";
                let event = {};
                let eachRecord = eachEventObj["records"][j];
                let username = eachRecord["username"];
                let usertype = eachRecord["usertype"];
                let reason = eachRecord["reasons"];
                if(usertype == undefined || reason == undefined){
                    content += extraText + "Group " + username + " will present\n";
                } else {
                    content += extraText + "Group " + username + "'s " + usertype + ": " + reason + "\n";
                }
                event = {title: content, start: startTime, end: endTime, 
                    color: color, textColor: textColor};
                eventSources.push(event);
            }
        }
    }
    return eventSources;
}
//date string convertor
// var initialDate = Date.parse('30 Nov 2020 09:30:00 GMT');
// const unixTimeZero = Date.parse('Tue Dec 01 2020 14:40:00 GMT+0800 (Hong Kong Standard Time)');
// const javaScriptRelease = Date.parse('Tue Dec 01 2020 15:00:00 GMT+0800 (Hong Kong Standard Time)');

// console.log(unixTimeZero);
// // expected output: 0

// // 20 minutes = 1200000
// console.log(javaScriptRelease);
// console.log(javaScriptRelease-unixTimeZero);
// // expected output: 818035920000

// var date = new Date(1606806000000);
// console.log(date.toUTCString())