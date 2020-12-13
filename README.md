# Smart_FYP_Scheduler

## Access the mongodb
First link the mongodb to your project path
/Users/hiuhongkwan/Documents/Developer_Tools/MongoDB_4.4.1/mongodb-macos-x86_64-4.4.1/bin/mongod --dbpath /Users/hiuhongkwan/Desktop/HKU_courses/Yr5-sem\ one/Comp4805-FYP/Smart_FYP_Scheduler/fyp_scheduler/data

Then call mongo to start manipulate the mongo db
/Users/hiuhongkwan/Documents/Developer_Tools/MongoDB_4.4.1/mongodb-macos-x86_64-4.4.1/bin/mongo
 
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
 
then start the web app using "npm start"

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

Specification:
MongoDB version: 4.4.1
NodeJS version: v12.18.4
AugularJS: 1.8.0
(https://ajax.googleapis.com/ajax/libs/angularjs/1.8.0/angular.min.js)
ExpressJS: 4.16.1

Some sample UIs:
<br>
<img src="https://github.com/kwanhiuhong/Smart_FYP_Scheduler/blob/master/demo/admin_page.png">
<img src="https://github.com/kwanhiuhong/Smart_FYP_Scheduler/blob/master/demo/login_page.png">
<img src="https://github.com/kwanhiuhong/Smart_FYP_Scheduler/blob/master/demo/scheduler_page.png">
