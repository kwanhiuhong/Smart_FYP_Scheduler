var main_app = angular.module('scheduler', []);

main_app.controller('scheduler_controller', function($scope, $http){
    $scope.load = function(){
        var calendarEl = document.getElementById('calendar');
        var calendar = new FullCalendar.Calendar(calendarEl, {
            selectable: true,
            initialView: 'timeGridWeek',
            allDaySlot: false,
            hiddenDays: [ 0, 6 ], // hide Sat and Sun
            slotDuration: '00:20:00',
            initialDate: '2020-12-01',
            
            headerToolbar: {
                left: '',
                center: 'title',
                right: 'prev,next',
                //right: 'dayGridMonth,timeGridWeek,timeGridDay'
            },
            eventClick: function(info) {
                alert(
                    'Reasons: ' + info.event.title + "\n"
                );
            
                // change the border color just for fun
                // info.el.style.borderColor = 'red';
            },
            select: function(info) {
                var nameAndReason = prompt("Please input why you are unable to join this timeslot: " 
                    + info.startStr 
                    + " to " 
                    + info.endStr 
                    + "\n Enter your name and reason(s):");

                (nameAndReason || info.view.type.match(/^timeGrid/)) && calendar.unselect(),
                nameAndReason && calendar.addEvent({
                    title: nameAndReason,
                    start: info.start,
                    end: info.end
                })
            }
        });
        calendar.render();
    };
    
});