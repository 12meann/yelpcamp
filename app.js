var express = require("express"),
  app = express(),
  bodyParser = require("body-parser"),
  mongoose = require("mongoose"),
  passport = require("passport"),
  flash = require("connect-flash"),
  LocalStrategy = require("passport-local"),
  Campground = require("./models/campground"),
  Comment = require("./models/comment"),
  User = require("./models/user"),
  methodOverride = require("method-override"),
  seedDB = require("./seeds");

require("dotenv").config();

var commentRoutes = require("./routes/comments"),
  reviewRoutes = require("./routes/reviews"),
  campgroundRoutes = require("./routes/campgrounds"),
  indexRoutes = require("./routes/index");

var url =
  process.env.DATABASEURL || "mongodb://localhost:27017/yelp_camp_price";
mongoose.connect(url, { useNewUrlParser: true, useCreateIndex: true });

app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());
app.locals.moment = require("moment");
// seedDB();

// PASSPORT CONFIGURATION
app.use(
  require("express-session")({
    secret: "Xavier is the cutest person in the whole world",
    resave: false,
    saveUninitialized: false
  })
);

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next) {
  res.locals.currentUser = req.user;
  res.locals.error = req.flash("error");
  res.locals.success = req.flash("success");
  next();
});

app.use("/", indexRoutes);
app.use("/campgrounds", campgroundRoutes);
app.use("/campgrounds/:id/comments", commentRoutes);
app.use("/campgrounds/:id/reviews", reviewRoutes);

app.listen(process.env.PORT || 5000, process.env.IP, function() {
  console.log("YelpCamp has started");
});
