var main_app = angular.module('fyp_scheduler', []);

main_app.controller('fyp_scheduler_controller', function($scope, $http){
    
    $scope.login = function(){
        $http.get("/login").then(function(response){
            if(response.data === ""){
                alert("Error for getting login");
            }else{
                // alert(response.data);
            }
        });
    }

    $scope.backend = function(){
        $http.get("/backend").then(function(response){
            if(response.data === ""){
                alert("Error for getting login");
            }else{
                alert(response.data);
            }
        });
    }


});

