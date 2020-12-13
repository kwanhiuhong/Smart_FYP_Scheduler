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

var usrInfo;
var eventsSource = {};
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
            // let modalBtn = document.getElementById("modalButton");
            // let modalTitle = document.getElementById("modalTitle");
            // let modalBody = document.getElementById("modalBody");
            // let startTime = convertToGMTString(info.event._instance.range.start);
            // let endTime = convertToGMTString(info.event._instance.range.end);

            // modalTitle.innerHTML = "Info from: " + startTime + " to " + endTime;
            // modalBody.innerHTML = info.event.title;
            // modalBtn.click();

            let startTime = convertToGMTString(info.event._instance.range.start);
            let endTime = convertToGMTString(info.event._instance.range.end);
            let eventInfo = "Are you sure to remove this slot from the calendar? - " + 
                            startTime + " to " + endTime + ": " + info.event.title;
            let rsp = confirm(eventInfo);
            if (rsp == true){
                let eventStartTimeIso = Date.parse(startTime);
                $http.delete("/removeUnavailableSlot?startTime="+eventStartTimeIso).then(function(response){
                    let rsp = response.data;
                    if (rsp == "Success"){
                        refreshCalendar();
                    }
                    let msg = msg_base_receive(rsp);
                    displayMsgOnCommandBox(msg);
                });
            }

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
                        // (info.view.type.match(/^timeGrid/)) && calendar.unselect(),
                        // calendar.addEvent({
                        //     title: nameAndReason,
                        //     start: info.start,
                        //     end: info.end,
                        //     color: "Cyan", 
                        //     textColor: "Black"
                        // })
                        refreshCalendar();
                        canSelectTable(true);
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
                    eventsSource = responseData;
                    let eventSources = [];

                    let sameTypeSlotsEvents = responseData["sameTypeSlots"];
                    let differentTypesSlotsEvents = responseData["differentTypesSlots"];
                    let confirmedSlotsEvents = responseData["confirmedSlot"];
                    let fullSlots = responseData["fullSlots"];

                    //removed confirmed group from full slots
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
        canSelectTable(false);
    };

    $scope.loadMsg = function(){
        $http.get("/fetchUserInfo").then(function(response){
            let chatBox = document.getElementById("msgBody");
            let welcomeHeader = document.getElementById("welcomeHeader");
            if (typeof(response.data) == "object"){
                usrInfo = response.data;
                let welcomeMsg = "<a>Welcome group " + usrInfo["username"] + "!</a>";
                let msg = msg_base_receive_default(usrInfo["username"], usrInfo["type"]);
                welcomeHeader.innerHTML = welcomeMsg;
                chatBox.insertAdjacentHTML('beforeend', msg);
            } else {
                let msg = "No login session found!";
                welcomeHeader.innerHTML = "<a>" + msg + "</a>";
                chatBox.insertAdjacentHTML('beforeend', msg_base_receive(msg));
            }
        });
    }

    $scope.confirmATime = function(){
        $http.put("/confirmATimeslot", schedulerConfigs).then(function(response){
            let responseData = response.data;
            if (Array.isArray(responseData)){
                // let data = responseData[0]
                // let startTime = parseInt(data["startTime"])
                // let endTime = startTime + getSeconds(schedulerConfigs.maxPresentationTime) * 1000;
                // let groupNo = data["username"]

                // calendar.addEvent({
                //     title: "Your Group - group "+groupNo+" will present",
                //     start: startTime,
                //     end: endTime,
                //     color: "Green", 
                //     textColor: "Black"
                // });
                // calendar.render();
                refreshCalendar();
            } else {
                alert(responseData);
            }
        });
    }

    $scope.refresh = function(){
        refreshCalendar();
    }

    function canSelectTable(canSelect){
        calendar.currentData.options.selectable = canSelect;
        calendar.render();
    }

    function refreshCalendar(){
        let temp = calendar.getEventSources();
        if (temp.length > 0){
            temp[0].remove();
            $scope.load();
        }
    }

    $scope.retrieveCmd = function(){
        let cmd = retrieveMsg();
        displayMsgOnCommandBox(msg_base_send(cmd));
        switch (cmd) {
            case "1" || 1:
                selectUnavailableSlots();
                break;
            case "2" || 2:
                reschedule();
                break;
            case "3" || 3:
                confirmADate();
                break;
            case "4" || 4:
                restartBot();
                break;
            default:
                let sentMsg = msg_base_receive("Please input the right command 1/2/3/4!");
                displayMsgOnCommandBox(sentMsg);
          }
    }

    function selectUnavailableSlots(){
        let defaultMsg = msg_base_receive("You already had confirmed slot. If you wish to reschedule, please trigger the rescheduling command.");
        canSelectTable(false);
        if (Object.keys(eventsSource).length > 0){
            if (eventsSource["confirmedSlot"].length == 0){
                canSelectTable(true);
                let sentMsg = msg_base_receive("You can now select your unavailable slots on the calendar!");
                displayMsgOnCommandBox(sentMsg);
            } else {
                displayMsgOnCommandBox(defaultMsg);
            }
        } else {
            displayMsgOnCommandBox(defaultMsg);
        }
    }

    function reschedule(){
        if (Object.keys(eventsSource).length > 0){
            if (eventsSource["confirmedSlot"].length == 0){
                let sentMsg = msg_base_receive("You don't have confirmed slot, no need to reschedule :)");
                displayMsgOnCommandBox(sentMsg);
            } else {
                let ans = confirm("Rescheduling will remove your group's confirmed slot, are you sure to continue?");
                if (ans == true){
                    $http.delete("/removeConfirmedSlot").then(function(response){
                        if (response.data != "Success"){
                            alert(reponse.data);
                        } else {
                            let msg = msg_base_receive("Removed confirmed slot successfully");
                            displayMsgOnCommandBox(msg);
                            refreshCalendar();
                            canSelectTable(true);
                        }
                    });
                } 
            }
        } else {
            let sentMsg = msg_base_receive("You don't have confirmed slot, no need to reschedule :)");
            displayMsgOnCommandBox(sentMsg);
        }
    }

    function confirmADate(){
        canSelectTable(false);
        $scope.confirmATime();
        let sentMsg = msg_base_receive("Operation completed!");
        displayMsgOnCommandBox(sentMsg);
    }

    function restartBot(){
        clearAllMsg();
        $scope.loadMsg();
        canSelectTable(false);
    }
});

function clearAllMsg(){
    let chatBox = document.getElementById("msgBody");
    chatBox.innerHTML = "";
}

function retrieveMsg(){
    let inputBox = document.getElementById("btn-input");
    let msg = inputBox.value;
    inputBox.value = "";
    return msg;
}

function scollCmdBoxToBottom(){
    let msgBody = document.getElementById("msgBody");
    msgBody.scrollTop = msgBody.scrollHeight;
}

function displayMsgOnCommandBox(msg=""){
    let chatBox = document.getElementById("msgBody");
    chatBox.insertAdjacentHTML('beforeend', msg);
    scollCmdBoxToBottom();
}

function msg_base_receive_default(groupNo, identity){
    let msg =   "<p>Welcome group " + groupNo + " " + identity + "! What would you like to do with this smart fyp scheduler?</p>" + 
                "<br>" + 
                "<p>1. Select unavailable slots</p>" + 
                "<p>2. Reschedule the assigned timeslot (Cancel current assigned slot and re-select unavailable slots)</p>" + 
                "<p>3. Confirm a presentation slot</p>" + 
                "<p>4. Exit</p>"
    return msg_base_receive(msg);
}

function msg_base_receive(msg){
    return "<div class='row msg_container base_receive'>" +
                "<div class='col-md-2 col-xs-2 avatar'>" + 
                    "<img src='./images/admin_icon.png' class=' img-responsive '>" + 
                "</div>" + 
                "<div class='col-md-10 col-xs-10'>" + 
                    "<div class='messages msg_receive'>" + 
                        "<p>" + msg + "</p>" + 
                        "<time datetime=''>Bot</time>" + 
                    "</div>" +
                "</div>" +
            "</div>"
}

function msg_base_send(msg=""){
    return "<div class='row msg_container base_sent'>" + 
                "<div class='col-xs-10 col-md-10'>" + 
                    "<div class='messages msg_sent'>" + 
                        "<p>" + msg + "</p>" + 
                    "</div>" + 
                "</div>" + 
                "<div class='col-md-2 col-xs-2 avatar'>" + 
                    "<img src='./images/user_icon.png' class=' img-responsive '>" + 
                "</div>" + 
            "</div>"
}

//helper functions
function getSeconds(timeString){
    let splittedStr = timeString.split(':');
    let hour = parseInt(splittedStr[0]);
    let minute = parseInt(splittedStr[1]);
    let second = parseInt(splittedStr[2]);
    return hour * 60 * 60 + minute * 60 + second
}

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