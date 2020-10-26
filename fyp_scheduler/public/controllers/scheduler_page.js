var main_app = angular.module('scheduler', []);

main_app.controller('scheduler_controller', function($scope, $http){
    $scope.load = function(){
        var calendarEl = document.getElementById('calendar');
        var calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'timeGridWeek',
            allDaySlot: false,
            hiddenDays: [ 0, 6 ], // hide Sat and Sun
            slotDuration: '00:20:00',
            initialDate: '2020-12-01',
            
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
            }
        });
        calendar.render();
    };


    
});