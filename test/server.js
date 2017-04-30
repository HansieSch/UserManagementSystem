"use strict";

// Simple express server used to test the user management system's endpoints.
var express = require("express");
var logger = require("morgan"); // Uncomment when running server without using tests.js
var bodyParser = require("body-parser");
var mongoose = require("mongoose");

var app = express();

mongoose.connect("mongodb://127.0.0.1:27017/User_Management_Test", () => {
  console.log("Database connected.");
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(logger("dev"));

app.put("/sanitize", function (req, res) {
});

app.use("/api", require("../index.js")(express, {
  adminOnly: true,
  secret: "biceps",
  mongoose: mongoose
}));

app.listen(3000, () => {
  console.log("Testing server started on port " + 3000);
});