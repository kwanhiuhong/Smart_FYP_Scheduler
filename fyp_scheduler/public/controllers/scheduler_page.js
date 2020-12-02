var main_app = angular.module('scheduler', []);

//this is the time allowed for presentation
var schedulerConfigs = {
    initDate: new Date(2020, 10, 30, 9, 0, 0), //note that in javascript, 0 = Jan, 10 = Nov, 11 = Dec.
    totalLength: 12,
    maxNoOfGrpsInEachSlot: 2,
    startDayTime: '09:00:00',
    endDayTime: '19:00:00',
    presentationTime: '00:20:00',
    isoNumberPerMinute: 60000,
    hiddenDays: [6, 0], // hide Sat and Sun
    localeString: "en-us",
    timeZone: "GMT"
}

var maxPresentationDuration = parseInt(schedulerConfigs.presentationTime.split(':')[1]);
var isoNumberForPresentTime = maxPresentationDuration * schedulerConfigs.isoNumberPerMinute;
var initialDate = schedulerConfigs.initDate;
var endDate = new Date(initialDate);
endDate.setDate(initialDate.getDate() + schedulerConfigs.totalLength);

main_app.controller('scheduler_controller', function($scope, $http){
    var calendarEl = document.getElementById('calendar');

    var calendar = new FullCalendar.Calendar(calendarEl, {
        timeZone: schedulerConfigs.timeZone,
        selectable: true,
        initialView: 'timeGridWeek',
        allDaySlot: false,
        hiddenDays: schedulerConfigs.hiddenDays, 
        slotDuration: schedulerConfigs.presentationTime,
        slotMinTime: schedulerConfigs.startDayTime,
        slotMaxTime: schedulerConfigs.endDayTime,
        initialDate: initialDate,
        validRange: {
            start: initialDate,
            end: endDate
        },
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
            let startTime = info.event._instance.range.start.toLocaleString(schedulerConfigs.localeString, { timeZone: schedulerConfigs.timeZone });
            let endTime = info.event._instance.range.end.toLocaleString(schedulerConfigs.localeString, { timeZone: schedulerConfigs.timeZone });

            modalTitle.innerHTML = "Info from: " + startTime.toString() + " to " + endTime.toString();
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
                + info.start.toLocaleString(schedulerConfigs.localeString, { timeZone: schedulerConfigs.timeZone }).toString()
                + " to " 
                + info.end.toLocaleString(schedulerConfigs.localeString, { timeZone: schedulerConfigs.timeZone }).toString()
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
        $http.get("/fetchEvents").then(function(response){
            let responseData = response.data;
            if (typeof(responseData) == "string"){
                alert(responseData);
            } else if (typeof(responseData) == "object"){
                if (Object.keys(responseData).length > 0){
                    let eventSources = [];
    
                    let sameTypeEventSource = eventCreator(responseData["sameTypeSlots"], "Cyan", "black");
                    let differentTypesEventSource = eventCreator(responseData["differentTypesSlots"], "", "black");
                    let confirmedEventSource = eventCreator(responseData["confirmedSlot"], "green", "black");
                    let fullEventSource = eventCreator(responseData["fullSlots"], "grey", "black");
    
                    eventSources = [...sameTypeEventSource, ...differentTypesEventSource, ...confirmedEventSource, ...fullEventSource];
                    
                    calendar.addEventSource(eventSources);
                }
            } else {
                alert(responseData);
            }
        });
        calendar.render();
    };

    $scope.confirmATime = function(){
        alert("testing");
        $http.get("/confirmATimeslot", schedulerConfigs).then(function(response){
            let responseData = response.data;
            if (Object.keys(responseData).length > 0){
                let eventSources = [];

                let sameTypeEventSource = eventCreator(responseData["sameTypeSlots"], "Cyan", "black");
                let differentTypesEventSource = eventCreator(responseData["differentTypesSlots"], "", "black");
                let confirmedEventSource = eventCreator(responseData["confirmedSlot"], "green", "black");
                let fullEventSource = eventCreator(responseData["fullSlots"], "grey", "black");

                eventSources = [...sameTypeEventSource, ...differentTypesEventSource, ...confirmedEventSource, ...fullEventSource];
                
                calendar.addEventSource(eventSources);
            }
        });
        // calendar.render();

        //after successfully confirm a date, the calendar should rerender
        //and show only the confirmed case.
    }
});

//helper functions
function eventCreator(timeslots, color, textColor){
    let eventSources = [];
    if (timeslots.length > 0){

        for(let i = 0; i < timeslots.length; ++i){
            let eachEventObj = timeslots[i];
            let startTime = parseInt(eachEventObj["startTime"]);
            let endTime = startTime + isoNumberForPresentTime;
            let content = "";
            let event = {};
            
            for(let j = 0; j < eachEventObj["records"].length; ++j){
                let eachRecord = eachEventObj["records"][j];
                let username = eachRecord["username"];
                let usertype = eachRecord["usertype"];
                let reason = eachRecord["reasons"];
                let isConfirmed = eachRecord["confirmed"];
                content += "Group " + username + "'s " + usertype + ": " + reason + "\n";
            }

            event = {title: content, start: startTime, end: endTime, 
                color: color, textColor: textColor};
            eventSources.push(event);
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