#BACK-END 

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