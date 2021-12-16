Smart FYP Scheduler
===
## Table of Contents

* [Setup](#setup)
* [Common MongoDB Commands](#common-mongodb-commands)
    * [Databases](#databases)
    * [Collections](#collections)
* [Specification](#specification)
* [Documentations](#documentations)
* [Usage](#usage)
   * [Login Page](#login-page)
   * [Admin Page](#admin-page)
   * [Scheduler Page](#scheduler-page)

Setup
===
Please download and install the relevant [MongoDB and NodeJS version](#Specification)

1. First link your mongodb to this project data folder
`/Users/hiuhongkwan/Documents/Developer_Tools/MongoDB_4.4.1/mongodb-macos-x86_64-4.4.1/bin/mongod --dbpath /Users/hiuhongkwan/Desktop/HKU_courses/Yr5-sem\ one/Comp4805-FYP/Smart_FYP_Scheduler/fyp_scheduler/data`

2. Then call mongo to start manipulating the mongo db
`/Users/hiuhongkwan/Documents/Developer_Tools/MongoDB_4.4.1/mongodb-macos-x86_64-4.4.1/bin/mongo`

3. Use the same terminal window at step 2, type in the following commands to create database and collections for this web app.<br>
`use fyp_sheduler`<br>
`db.createCollection("ConfirmedTime")`<br>
`db.createCollection("GroupInfo")`<br>
`db.createCollection("UnavailableTime")`<br>
`db.createCollection("User")`<br>
Note that we have 4 collections in total.<br>
`db.User.insert({"username" : "admin", "password" : "admin", "type" : "admin"})`<br>
(You need this to login into the admin page)<br>
For other commonly used MongoDB commands, pls refer to [here](#Common-MongoDB-Commands)
<br>![](https://i.imgur.com/LvLcHNR.png)

4. Browse/cd to the directory where your app.js is located, in our case that would be:<br>
`/Users/hiuhongkwan/Desktop/HKU_courses/Yr5-sem\ one/Comp4805-FYP/Smart_FYP_Scheduler/fyp_scheduler`<br>
Type the following command in the terminal:<br>
`npm start`<br>

5. Open a web browser and type in "https://localhost:3000" to start the web app.

Common MongoDB Commands
===
 Some common MongoDB commands in terminal:
 ### Databases
 1. type "show dbs" to display all databases you have
 2. type "use fyp_sheduler" to create a db or use that db
 3. type "db.dropDatabase()" to drop the database
 
 ### Collections
 1. type "show collections" you get what collections you have
 2. type "db.User.find()" show all details about the user collection.
 3. type "db.createCollection(name, options)" to create a collection
 4. type "db.COLLECTION_NAME.drop()" to drop a collection
 5. type "db.collection_name.insert({'key':'value', 'key':'value'})" to insert a record in a collection
 6. type "db.collection_name.remove({})" to remove all records in a collection
 7. type "db.collection_name.remove({"key":"value"})" to remove certain records in a collection
 
Specification
===
1. MongoDB version: 4.4.1
2. NodeJS version: v12.18.4
3. AugularJS: 1.8.0
(https://ajax.googleapis.com/ajax/libs/angularjs/1.8.0/angular.min.js)
4. ExpressJS: 4.16.1
5. Bootstrap: 4.5.2
6. Font Awesome Icons: 4.7.0

Documentations
===
Documentations needed:
1. MongoDB commands in terminal:
https://www.tutorialspoint.com/mongodb/mongodb_quick_guide.htm

2. Monk in node.js (How to manipulate the mongodb in nodejs runtime):
https://automattic.github.io/monk/docs/GETTING_STARTED.html

3. AugularJS
https://angular.io/docs

4. NodeJS
https://nodejs.org/docs/latest-v12.x/api/modules.html

5. ExpressJS 
https://expressjs.com/en/4x/api.html#router

6. Bootstrap
https://getbootstrap.com

7. Font Awesome Icons
https://fontawesome.com/v4.7.0/icons/

8. Full Calendar
https://fullcalendar.io/docs

Usage
===

Login Page
---
The default username and password for admin is "admin".
![](https://i.imgur.com/7c3Qf9v.png)

Admin Page
---
Once enter this page for the first time, you should expect no data on this page
![](https://i.imgur.com/irYPloQ.png)
To import data, you either download a template and input the data by your self, or use our sample data which is located at "Smart_FYP_Scheduler/fyp_scheduler/public/data_source/"<br>
After that you shall expect to see Group No and password attached to your data like the following:
![](https://i.imgur.com/tpIQwTX.png)
<br>
P.S: Our data comes from https://intranet.cs.hku.hk/csintranet/contents/fyp/fyp_details.jsp?acadYear=2020

Scheduler Page
---
Use the group number and password generated above to enter this scheduler page. Then you can follow the command Box to start picking unavailable timeslots and schedule/reschedule a new timeslot.
![](https://i.imgur.com/ZZSq4NP.png)
<br>

You can select the timeslot you want by inputting "1" in the chatbox
![](https://github.com/kwanhiuhong/Smart_FYP_Scheduler/tree/master/demo/Select_time_slot.png)
<br>

Or you can remove the timeslot you scheduled and reschedule a new time slot if you wish
![](https://github.com/kwanhiuhong/Smart_FYP_Scheduler/tree/master/demo/Remove_time_slot.png)
