var main_app = angular.module('fyp_scheduler', []);

main_app.controller('fyp_scheduler_controller', function($scope, $http){
    
    $scope.login = function(){
        let username = $scope.login_name;
        let password = $scope.login_password;

        if (username === undefined || password === undefined){
            alert("Please enter your username/group number and/or password.");
        } else {
            let username = $scope.login_name;
            $http.get("/login?username="+username+"&password="+password).then(function(response){
                if (response.data === "") {
                    alert("Username/group no " + username + " could not be found in our record!");
                } else if (response.data === "Incorrect password"){
                    alert("Incorrect password for username/groupno " + username + "!");
                } else if (response.data === true){
                    window.location.href = "/admin_page.html";  
                }
            });
        }
    }
});