if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const app = express();
const bcrypt = require("bcrypt");
const passport = require("passport");
const flash = require("express-flash");
const session = require("express-session");
const methodOverride = require("method-override");
const { MongoClient } = require("mongodb");

const initializePassport = require("./passport-config");
initializePassport(
  passport,
  (email) => users.find((user) => user.email === email),
  (id) => users.find((user) => user.id === id)
);
/*

*/

// MongoDB connection URI
const uri = "mongodb://localhost:27017"; // Change this to your MongoDB URI

// Database name
const dbName = "HackathonDB";
// const db_Name_Dates_Hazarika = "DatesDB_Hazarika";
// Create a MongoClient instance
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Connect to the database
client
  .connect()
  .then(() => {
    console.log("Connected to MongoDB");
    // Get a reference to the database
    const db = client.db(dbName);

    // You can now perform CRUD operations on the database
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });

// Function to save a user to the users collection
async function saveUser(db, user) {
  // Get a reference to the users collection
  const usersCollection = db.collection("users");

  // Insert the user document into the collection
  const result = await usersCollection.insertOne(user);

  console.log(`User saved with ID: ${result.insertedId}`);
}
// Function to load users from the `users` collection
async function loadUsers(db) {
  // Get a reference to the `users` collection
  const usersCollection = db.collection("users");

  // Query the `users` collection to retrieve all user documents
  const users = await usersCollection.find({}).toArray();

  // Print the users (you can do other processing as needed)
  console.log("Users:", users);

  // Return the users
  return users;
}

// Function to load dates from the `dates` collection
async function loadDates(db, veneue) {
  // Get a reference to the `dates` collection
  const datesCollection = db.collection("DatesDB_" + veneue);
  // Query the `dates` collection to retrieve all date documents
  const dates = await datesCollection.find({}).toArray();
  // Print the dates (you can do other processing as needed)
  console.log("Dates:", dates);
  // Return the dates
  return dates;
}
/*
 */
let users = [];

app.set("view-engine", "ejs");
app.use(express.urlencoded({ extended: false }));
app.use(flash());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride("_method"));

app.get("/", checkAuthenticated, (req, res) => {
  res.render("index.ejs", { name: req.user.name });
});
/**/
let dates = [];
app.get("/bhupenHazarika", checkNotAuthenticated, (req, res) => {
  client
    .connect()
    .then(() => {
      console.log("Connected to MongoDB");
      const db = client.db(dbName);

      // Load users from the database
      loadDates(db,"Hazarika")
        .then((dates_arr) => {
          dates = dates_arr;
          // Here you can handle the users data
          console.log("Retrieved dates data:", dates);
        })
        .catch((error) => {
          console.error("Error loading users:", error);
        });
    })
    .catch((error) => {
      console.error("Error connecting to MongoDB:", error);
    });
    console.log("pleasee",dates);
  res.render("Hazarika.ejs", {array: dates});
});
/**/
app.get("/login", checkNotAuthenticated, (req, res) => {
  // / Example usage
  client
    .connect()
    .then(() => {
      console.log("Connected to MongoDB");
      const db = client.db(dbName);

      // Load users from the database
      loadUsers(db)
        .then((users_arr) => {
          users = users_arr;
          // Here you can handle the users data
          console.log("Retrieved users data:", users);
        })
        .catch((error) => {
          console.error("Error loading users:", error);
        });
    })
    .catch((error) => {
      console.error("Error connecting to MongoDB:", error);
    });
  res.render("login.ejs");
});

app.post(
  "/login",
  checkNotAuthenticated,
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true,
  })
);

app.get("/register", checkNotAuthenticated, (req, res) => {
  // / Example usage
  client
    .connect()
    .then(() => {
      console.log("Connected to MongoDB");
      const db = client.db(dbName);

      // Load users from the database
      loadUsers(db)
        .then((users_arr) => {
          users = users_arr;
          // Here you can handle the users data
          console.log("Retrieved users data:", users);
        })
        .catch((error) => {
          console.error("Error loading users:", error);
        });
    })
    .catch((error) => {
      console.error("Error connecting to MongoDB:", error);
    });
  res.render("register.ejs");
});

app.post("/register", checkNotAuthenticated, async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    users.push({
      id: Date.now().toString(),
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword,
    });
    client
      .connect()
      .then(() => {
        console.log("Connected to MongoDB");
        const db = client.db(dbName);

        // Save the user to the database
        saveUser(db, users[users.length - 1]);
      })
      .catch((error) => {
        console.error("Error connecting to MongoDB:", error);
      });
    res.redirect("/login");
  } catch {
    res.redirect("/register");
  }
});

app.delete("/logout", (req, res) => {
  req.logOut(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/login");
  });
});

function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }

  res.redirect("/login");
}

function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect("/");
  }
  next();
}

app.listen(3000);
