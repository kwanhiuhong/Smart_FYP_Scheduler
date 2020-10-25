var main_app = angular.module('admin_page', ['ngFileUpload']).filter('fromMap', function() {
    return function(input) {
      var out = {};
      input.forEach((v, k) => out[k] = v);
      return out;
    };
  });

main_app.controller('admin_page_controller', function($scope, $http){

    $scope.show_table = false;
    $scope.show_no_login = false;
    $scope.show_no_data = false;

    $scope.init = function(){
        $http.get("/checkLogin").then(function(response){
            if (response.data === ""){
                $scope.show_no_login = true;
            } else {
                displayData();   
            }
        });
    }

    function displayData(){
        $http.get("/getData").then(function(response){
            let length = response.data.length;
            if(length > 0){

                let excelArrayObj = [];
                for(let i = 0; i < length; i++){
                    let raw_data = new Map(Object.entries(response.data[i]));
                    excelArrayObj.push(raw_data);
                }

                let headers = Object.keys(response.data[0]);

                $scope.show_no_data = false;
                $scope.headers = headers;
                $scope.fyp_data = excelArrayObj;
                $scope.show_table = true;
            } else {
                $scope.show_no_data = true;
            }
        });
    }

    $scope.upload_excel = function(){
        document.getElementById("file_upload").click();
    }

    $scope.parse_file = function(file){
        let regex = /^([a-zA-Z0-9\s_\\.\-:])+(.xls|.xlsx)$/;
        if (regex.test(file.name.toLowerCase())) {
            if (typeof (FileReader) != "undefined") {
                let reader = new FileReader();
                //For Browsers other than IE.
                if (reader.readAsBinaryString) {
                    reader.onload = function (e) {
                        $scope.process_excel(e.target.result);
                    };
                    reader.readAsBinaryString(file);
                } else {
                    //For IE Browser.
                    reader.onload = function (e) {
                        let data = "";
                        let bytes = new Uint8Array(e.target.result);
                        for (let i = 0; i < bytes.byteLength; i++) {
                            data += String.fromCharCode(bytes[i]);
                        }
                        $scope.process_excel(data);
                    };
                    reader.readAsArrayBuffer(file);
                }
            } else {
                alert("This browser does not support HTML5.");
            }
        } else {
            alert("Please upload a valid Excel file.");
        }
    }

    $scope.process_excel = function (data) {
        //Read the Excel File data.
        let workbook = XLSX.read(data, {
            type: 'binary'
        });

        //Fetch the name of First Sheet.
        let firstSheet = workbook.SheetNames[0];

        //Read all rows from First Sheet into an JSON array.
        let excelArrayJson = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[firstSheet]);
        let length = excelArrayJson.length;

        let excelJsonJson = {};
        for(let i = 1; i <= length; i++){
            excelJsonJson[i] = excelArrayJson[i-1];
        }

        $http.put("/importData", excelJsonJson).then(function(response){
            if (response.data === "Success"){
                alert("Successfully loaded data!");
                window.location.reload();
            } else {
                alert("Fail to import data, errors: " + response.data);
            }
        });
    };

    $scope.clear_all_data = function(){
        $http.delete("/clearData").then(function(response){
            if (response.data === "Success"){
                alert("Succeeded!");
                window.location.reload();
            } else {
                alert("Fail to clear, errors: " + response.data);
            }
        });
    }

    $scope.export_to_excel = function(){
        var blob = new Blob([document.getElementById('exportable_table').innerHTML], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8",
        });
        saveAs(blob, "GroupInfo.xls");
    };
});