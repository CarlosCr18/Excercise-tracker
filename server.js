const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const mongoose = require("mongoose");
mongoose.connect(process.env.MONGO_URI);
const { Schema } = mongoose;

const excericeSchema = new Schema({
  userName: { type: String, required: true },
  count: Number,
  log: [],
});

const excerciesLog = mongoose.model("excerciseLog", excericeSchema);

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: "false" }));
app.use(bodyParser.json());

app.use(cors());
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

//Create new user
app.post("/api/users", (req, res) => {
  let newUserName = req.body.username;
  let responseObject = { username: newUserName, _id: "" };
  // console.log(newUserName, "REQPARAMS");

  let newUserDb = new excerciesLog({
    userName: newUserName,
    count: 0,
    log: [],
  });
  newUserDb.save((err) => {
    if (err) return console.error(err, "error");
  });

  let newUserId = newUserDb._id.toString();
  responseObject["_id"] = newUserId;
  res.send(responseObject);
});

app.get("/api/users", (req, res) => {
  let userMap = [];
  excerciesLog.find({}, (err, users) => {
    if (err) return console.error(err, "error");
    users.forEach((user) => {
      let currentObject = { _id: user._id.valueOf(), username: user.userName };
      userMap.push(currentObject);
    });

    res.send(userMap);
  });
});

//Add user log excercise data
app.post("/api/users/:_id/exercises", (req, res) => {
  let fullParams = req.body;
  let descriptionParam = fullParams.description;
  let durationParam = fullParams.duration;

  let dateParam =
    fullParams.date != undefined || ""
      ? new Date(fullParams.date.replace(/-/g, "/")).toDateString()
      : new Date().toDateString();
  let currentUserId = req.params._id;
  let personRes = {
    _id: currentUserId,
    username: "",
    date: dateParam,
    duration: parseInt(durationParam),
    description: descriptionParam,
  };

  excerciesLog.find({ _id: currentUserId }, function (err, personFound) {
    if (err) return console.log(err);
    personFound[0].count = parseInt(personFound[0].count) + 1;
    personFound[0].log = personFound[0].log.concat({
      description: descriptionParam,
      duration: durationParam,
      date: dateParam,
    });
    personFound[0].save(function (err, person) {
      if (err) return console.log(err);
      // console.log(person, "PERSON");
    });
    personRes["username"] = personFound[0].userName;
    res.send(personRes);
  });
});

//get user dateParam
app.get("/api/users/:_id/logs", (req, res) => {
  let currentUserId = req.params._id;
  let { from, to, limit } = req.query;
  let fromDate = new Date(from);
  let toDate = new Date(to);
  console.log(req.params, "REQPARAMS");
  console.log(req.query, "QUERY");
  console.log(req.body, "BODY");

  // console.log(req.query, "QUERY");
  excerciesLog.find({ _id: currentUserId }, (err, result) => {
    if (err) return console.log(err);
    let bFrom = true;
    let bTo = true;
    let returnObject = {
      _id: result[0]._id,
      username: result[0].userName,
      from: "",
      to: "",
    };

    if (fromDate == "Invalid Date") {
      delete returnObject.from;
      bFrom = false;
    } else {
      returnObject.from = fromDate.toDateString();
    }
    if (toDate == "Invalid Date") {
      delete returnObject.to;
      bTo = false;
    } else {
      returnObject.to = toDate.toDateString();
    }

    // count: filteredArray.length,
    // log: filteredArray,
    let filteredArray = result[0].log
      .filter((log) => {
        if (!bFrom || !bTo) {
          return true;
        }
        return new Date(log.date) >= fromDate && new Date(log.date) <= toDate;
      })
      .reverse();

    if (limit > 0) {
      filteredArray = filteredArray.splice(0, limit);
    }
    returnObject.count = filteredArray.length;
    // console.log(filteredArray);
    for (let i = 0; i < filteredArray.length; i++) {
      filteredArray[i].duration = parseInt(filteredArray[i].duration);
      filteredArray[i].date = new Date(filteredArray[i].date).toDateString();
    }
    returnObject.log = [...filteredArray];
    // console.log(returnObject);
    res.send(returnObject);
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
