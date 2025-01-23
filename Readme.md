# BACK-END 

- tools
      - moon modeler and eraser.io  :-
            Use for structure the data for database field and data types
      

HOW DATA SHOULD MODEL:-

these lines need for creating models

import mongoose from "mongoose"
const userSchema = new mongoose.Schema({
        {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true
    },
    password: {
      type: String,
      required: true,

    }
  },
  {timestamps: true}
})
export const User = mongoose.model("User", userSchema)

# backend with JavaScript

# connect database
    - create mongodb account 
    - create database network and database access
    - configure ip address 0.0.0.0/0
    - database deployment
        - click connect
        - compass
        - copy string and replace <password/>

In constants create the database name like:- export const DB_NAME = "youtubevideo"  

Database connection have 2 types:
    - write fn inside of index.js
    - write code inside db folder file and import inside the index.js

All ways remember database is always in another contienet.
so when you talk with db take time, so always use (async and await) and (try and catch).

# mongodb atlas and mongodb structure

Hierarchy in MongoDB Atlas:

1. Project:

The top-level container in MongoDB Atlas. A project can contain multiple clusters (but only one free-tier cluster per project).
A project organizes your resources, including databases, clusters, users, and network access configurations.

2. Cluster:

A cluster is a set of MongoDB servers (nodes) that handle your databases.
Inside a project, you can have one or more clusters. Each cluster hosts databases.
A free-tier project allows only one M0 (free-tier) cluster.

3. Database:

A database is a container inside a cluster. Each database holds collections.
You can create multiple databases inside a cluster.

4. Collection:

A collection is a group of documents, similar to a table in a relational database.
Collections are stored inside databases.
Collections don’t enforce a schema, so documents in the same collection can have different structures.

5. Document:

A document is the individual data record, stored in JSON-like format (BSON in MongoDB).
A document is similar to a row in a relational database.
Documents are stored inside collections.


Hierarchy Example:
Project: MyProject

Cluster: Cluster0
Database: ecommerceDB
Collection: products
Document: {"_id": 1, "name": "Laptop", "price": 1000}
Collection: users
Document: {"_id": 101, "name": "John Doe", "email": "johndoe@example.com"}


# dotenv 
require('dotenv').config()          give path here ====>  // require('dotenv').config({path: './env'})

as early as possible in your application, import and configure dotenv.
use for when run code then as soon as possible need to load .env variable in main file or accessable all over application.

------------------------- morden way ------------------------
    import dotenv from "dotenv"
    dotenv.config({
        path: './env'
    })

expirenmental feature
make changes inside of package.json
    "scripts": {
        "dev": "nodemon -r dotenv/config --experimental-json-modules src/index.js"
    },

# Express Req
    app.use() :- middleware and configuration settings

# middleware

checking the condition that user is pass or not if yes then give res.
(err,req,res,next) next is use for middleware, every checks use next flag means when one check complete then that check pass next to futher check.

must use next() when writing middleware fn

# credintials 
app.use(cors({
    credentials: true,
}))

CORS Credentials
In CORS (Cross-Origin Resource Sharing), "credentials" refer to whether the browser should include credentials like cookies, HTTP authentication, or client-side certificates when making cross-origin requests.

# body

body in Express.js
The body refers to the data sent by the client in the request body. It can be in different formats like JSON, plain text, or form data. To access the body, you use middleware like express.json().

When to Use?
When the client sends JSON data in a POST or PUT request.

app.use(express.json()); 


# app.use(express.json()); 

app.use(express.json()) is a middleware function in Express.js that parses incoming JSON request payloads and makes them available in req.body. Without this middleware, the req.body property will remain undefined for JSON payloads.

Express does not parse the body of incoming requests. This is to keep it lightweight and modular. If you're building APIs or handling POST requests where the client sends JSON data, you need express.json() to access the parsed data.

Parses JSON Request Bodies: It reads the incoming request body if the Content-Type is application/json, parses it into a JavaScript object, and attaches it to req.body.
Handles Only JSON Data: If the request body is not JSON, it doesn't process it (other middleware like express.urlencoded() is needed for other data formats).

# urlencoded
urlencoded in Express.js
The urlencoded format is used for handling HTML form data submitted via application/x-www-form-urlencoded. It converts the data into a JavaScript object.

When to Use?
When handling data from forms (e.g., name=value pairs).

# multer 
multer in Express.js
multer is middleware used for handling file uploads. It saves files to a specified folder and provides metadata about the uploaded files.

When to Use?
When the client uploads files (e.g., images, PDFs).

# moduls 

it use like 
module.exports = function_name      //it like default exports
module.exports = {function_name, function_name}    //2nd way

# server created using node.js

let http =require("http")

let server = http.createServer((req, res) =>{
    if(req.url == "/"){
        res.end("this is Home");
    }
})

server.listen(8000, ()=>{
    console.log("server listening on");
})

cmd> node index.js          //for start server

In node.js
res.end() only take string or buffer
The issue with your code is that you are trying to send the JavaScript object obj directly as the response using res.end(obj). However, res.end() only accepts a string or a Buffer, and JavaScript objects need to be converted to a string format, such as JSON, before they can be sent in the response.


# res.send()
But in Express

In Express.js, the res.send() method is used to send a response to the client. You can use res.send() to send various types of data, including:

Strings
Objects (which will be automatically converted to JSON)
Buffers (binary data, such as images or files)

# only take one arg
res.send("about details", currentid);           //wrong
res.send("about details"+currentid);           //correct
res.send(`about details ${currentid}`);        //correct

res.send() only accepts a single argument:

It can send a string, buffer, or object, but not multiple arguments.
The second argument (currentid) is ignored, causing unintended behavior.

# Middleware Usage:

express.json(): Parses JSON bodies.                                             //for access req.body
express.urlencoded(): Parses URL-encoded bodies (e.g., from forms).             //for access req.query
express.text(): Parses raw text bodies (when Content-Type: text/plain).         //for access req.body
Accessing Data:

req.body: Contains the parsed data from the body (JSON, form data, or plain text).
req.query: Contains query parameters (e.g., /login?user=john).
Response Object:

res.send() sends back an object containing the parsed data.

# setup mongodb connection with express

const client = new MongoClient(dbConnectionUrl);        //for create new client from mongoclient

await client.connect();                                 //connect new client with db
let database = client.db("Mymongo");                    //set dbName using that client

let myDB = await dBConnection();                        //this use when call that db into another file
let stdCollection = myDB.collection("students");        //create the collection using that db     

# get data from mongodb localhost
# What is a Cursor in MongoDB?
A cursor in MongoDB is a pointer to the result set of a query. When you perform a query using methods like find(), MongoDB doesn’t immediately load all the data into memory. Instead, it returns a cursor, which you can use to retrieve the data incrementally.


Efficient for large datasets: Cursors allow you to work with the data in smaller chunks instead of loading everything into memory at once.

Lazy evaluation: The data isn’t fetched from the database until you explicitly iterate through the cursor.

Methods to work with cursors:
toArray(): Converts the cursor to an array of documents.
forEach(): Iterates through each document in the cursor.

# Example of a Cursor:
const cursor = collection.find({}); // Returns a cursor, not the actual data
Here, cursor contains a pointer to the data that matches the query {} (in this case, all documents).

# How to Work with a Cursor
Option 1: Convert the Cursor to an Array

const data = await collection.find({}).toArray();
console.log(data); // Array of all documents

Option 2: Process Documents Incrementally

const cursor = collection.find({});
await cursor.forEach(doc => {
  console.log(doc); // Process each document one by one
});

# let data = await stdCollection.find({}).toArray(); because:

find({}): Fetches all documents (cursor, not actual data).
toArray(): Converts the cursor into an array of documents for easier processing.
await: Waits for the asynchronous operation to complete and get the actual data.
This combination ensures you can work directly with the retrieved documents instead of promises or cursors.

# "/student-delete/:id/:name"

when you want to capture dynamic values directly from the URL, you use colon (:) notation in the route path.

/student-delete/:id/:name: This means you expect two route parameters:
id (the student's ID)
name (the student's name)

# objectId

let delRes = await stdCollection.deleteOne({ _id: ObjectId(id) });  // This won't work because ObjectId is a class and needs `new` to instantiate.

Why is new used with ObjectId?
MongoDB uses ObjectId as the default type for document identifiers (_id). When you retrieve documents from MongoDB, the _id field is usually an ObjectId, not a regular string. Therefore, when you receive an id in a string format (like from a URL parameter), you need to convert it into a valid ObjectId before using it in MongoDB queries.

MongoDB _id is an ObjectId:-
MongoDB generates ObjectId values as the default value for the _id field, which is a 12-byte identifier used to uniquely identify documents.
Example: _id: ObjectId("605c72ef1532071b17d3f0c").


# use of new keyword in   let enquiry = new enquiryModel
Creating an Object with new:

new enquiryModel({ ... }) creates a structured object using the enquiryModel (which is likely a schema or blueprint defined using something like Mongoose for MongoDB).
Why Use new:

Purpose of new: The new keyword ensures that the object is created with all the rules and behaviors defined in enquiryModel. For example:
enquiryModel might specify that name is a required field, email should match a specific format, and phone should be a number.
When you use new, it applies all these rules automatically.
Without new, you would just have a plain object that doesn't follow any rules or connect to the database.

Creates a New Empty Object:
The new keyword starts by creating a blank object: {}.
Links the Object to enquiryModel:
It connects the new object to the "rules" or "blueprint" defined in enquiryModel.
For example, if enquiryModel specifies that email should be a valid email, this new object will know to enforce that rule.
Fills the Object with Your Data:
The { name: sName, email: sEmail, phone: sPhone, message: sMessage } part tells new what data to put in the object.
It maps your provided data into the fields defined in the enquiryModel.
Gives the Object Special Abilities:
Without new, the object is just plain data. With new, it becomes an "intelligent" object that:
Can validate the data (e.g., check if the email is valid).
Can save itself to a database or perform other operations defined in the enquiryModel.
These abilities come from the enquiryModel schema or class.

# without new 

If you were able to add data to the database without using the new keyword and didn’t encounter any errors, it's likely because your library or framework (e.g., Mongoose in Node.js) has some flexibility built into how it handles objects. Let me explain why this works but why using new is still important.


#### PHASE TWO ####

mongoose pre hook
when saving data just before that run that hook for encrypt

perform operation on events validate, save, update, remove, delete, init

using of this we can create the custom methods like above validate, save, update, remove, delete, init
userSchema.methods

access token dont store in db but refresh will store


# jwt
JWT (JSON Web Token) can be used as a Bearer Token in the context of authorization.
who have token data will send

# file system

unlink(path) :- when file delete file become unlink.

# multer
This code configures and exports a file-upload handler using the Multer library in Node.js. Multer is middleware for handling multipart/form-data, which is primarily used for uploading files.

multer.diskStorage is a function provided by Multer to configure how and where files should be stored on your disk.


# 12
# router and controller with debugging

    - create route for user
    - create controller for register user
    - get userRoutes in app.js


# 13 
# register controller

    - get user details from frontend
    - validate that data, not emapty
    - check if user already exist (username, email)
    - check for images, avatar
    - if available upload cludinary
    - create user object - create entry in db
    - remove password and refresh token field from respone
    - check for user creation
    - return res