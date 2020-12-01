var main_app = angular.module('scheduler', []);
var presentationTime = '00:20:00';
var iosNumberForPresentTime = 20 * 60000;

main_app.controller('scheduler_controller', function($scope, $http){
    var calendarEl = document.getElementById('calendar');
    // var initialDate = Date.parse('30 Nov 2020 09:30:00 GMT');
    var initialDate = new Date(2020, 10, 30);
    var endDate = new Date(initialDate);
    endDate.setDate(initialDate.getDate() + 14);

    var calendar = new FullCalendar.Calendar(calendarEl, {
        selectable: true,
        initialView: 'timeGridWeek',
        allDaySlot: false,
        hiddenDays: [ 0, 6 ], // hide Sat and Sun
        slotDuration: presentationTime,
        slotMinTime: '09:00:00',
        slotMaxTime: '19:00:00',
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
        // events: [
        //     {
        //       title  : 'event3',
        //       start  : '2020-12-01T12:40:00',
        //       end  : '2020-12-01T13:00:00'
        //     }
        // ],
        eventClick: function(info) {
            let modalBtn = document.getElementById("modalButton");
            let modalTitle = document.getElementById("modalTitle");
            let modalBody = document.getElementById("modalBody");
            let startTime = info.event._instance.range.start;
            let endTime = info.event._instance.range.end;
            startTime.setHours(startTime.getHours() - 8);
            endTime.setHours(endTime.getHours() - 8);

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
                + info.start.toString() 
                + " to " 
                + info.end.toString() 
                + "\n Enter your name and reason(s):");

            let isoNumber = Date.parse(info.start);
            $http.get("/insertEvent?startTime="+isoNumber+"&reasons="+nameAndReason).then(function(response){
                if (response.data === "Success") {
                    (nameAndReason || info.view.type.match(/^timeGrid/)) && calendar.unselect(),
                    nameAndReason && calendar.addEvent({
                        title: nameAndReason,
                        start: info.start,
                        end: info.end
                    })
                } else {
                    alert("Fail to add event to calendar, error: " + response.data);
                } 
            });
        }
    });

    $scope.load = function(){
        $http.get("/fetchEvents").then(function(response){
            if (response.data.length > 0){
                let eventSources = [];
                for(let i = 0; i < response.data.length; ++i){
                    let eachEventObj = response.data[i];
                    let startTime = parseInt(eachEventObj["startTime"]);
                    let endTime = startTime + iosNumberForPresentTime;
                    let content = "";
                    let event;
                    
                    for(let j = 0; j < eachEventObj["records"].length; ++j){
                        let eachRecord = eachEventObj["records"][j];
                        let username = eachRecord["username"];
                        let usertype = eachRecord["usertype"];
                        let reason = eachRecord["reasons"];
                        let isConfirmed = eachRecord["confirmed"];
                        content += "Group " + username + "'s " + usertype + ": " + reason + "\n";
                    }

                    event = {title: content, start: startTime, end: endTime};
                    eventSources.push(event);
                }
                calendar.addEventSource(eventSources);
            }
        });
        calendar.render();
    };
});


//date string convertor
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