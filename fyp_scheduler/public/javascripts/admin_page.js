var main_app = angular.module('admin_page', ['ngFileUpload']);

main_app.controller('admin_page_controller', function($scope, $http){
    $scope.show_no_login = false;
    $scope.show_no_data = false;

    $scope.init = function(){
        $http.get("/admin").then(function(response){
            if (response.data === ""){
                $scope.show_no_login = false;
            } else {
                $scope.show_no_data = true;
            }
        });
    }

    $scope.upload_excel = function(){
        document.getElementById("file_upload").click();
    }

    $scope.parse_file = function(file){
        var regex = /^([a-zA-Z0-9\s_\\.\-:])+(.xls|.xlsx)$/;
        if (regex.test(file.name.toLowerCase())) {
            if (typeof (FileReader) != "undefined") {
                var reader = new FileReader();
                //For Browsers other than IE.
                if (reader.readAsBinaryString) {
                    reader.onload = function (e) {
                        $scope.ProcessExcel(e.target.result);
                    };
                    reader.readAsBinaryString(file);
                } else {
                    //For IE Browser.
                    reader.onload = function (e) {
                        var data = "";
                        var bytes = new Uint8Array(e.target.result);
                        for (var i = 0; i < bytes.byteLength; i++) {
                            data += String.fromCharCode(bytes[i]);
                        }
                        $scope.ProcessExcel(data);
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

    $scope.ProcessExcel = function (data) {
        //Read the Excel File data.
        var workbook = XLSX.read(data, {
            type: 'binary'
        });

        //Fetch the name of First Sheet.
        var firstSheet = workbook.SheetNames[0];

        //Read all rows from First Sheet into an JSON array.
        var excelRows = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[firstSheet]);

        //Display the data from Excel file in Table.
        // alert(excelRows);
        $scope.$apply(function () {
            $scope.Customers = excelRows;
            $scope.IsVisible = true;
        });
    };

    $scope.clear_all_data = function(){

    }

    $scope.export_to_excel = function(){

    }
});

