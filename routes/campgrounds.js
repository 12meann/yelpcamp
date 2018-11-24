var express = require("express");
var router = express.Router();
var Campground = require("../models/campground");
var Comment = require("../models/comment");
var Review = require("../models/review");
var middleware = require("../middleware");
var multer = require('multer');   
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter})

// for cloudinary
var cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: 'meann', 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// index show all campground

router.get("/", function(req, res){
    var perPage = 8;
    var pageQuery = parseInt(req.query.page);
    var pageNumber = pageQuery ? pageQuery : 1;
    var noMatch = null;
    if(req.query.search) {
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        Campground.find({name: regex}).skip((perPage * pageNumber) - perPage).limit(perPage).sort({"createdAt": -1}).exec(function (err, allCampgrounds) {
            Campground.count({name: regex}).exec(function (err, count) {
                if (err) {
                    console.log(err);
                    res.redirect("back");
                } else {
                    if(allCampgrounds.length < 1) {
                        noMatch = req.flash("error", "No campgrounds match that query. Please try again.");
                        return res.redirect("/campgrounds");
                    }
                    res.render("campgrounds/index", {
                        campgrounds: allCampgrounds,
                        current: pageNumber,
                        pages: Math.ceil(count / perPage),
                        noMatch: noMatch,
                        search: req.query.search
                    });
                }
            });
        });
    } else {
        // get all campgrounds from DB
        Campground.find({}).skip((perPage * pageNumber) - perPage).limit(perPage).exec(function (err, allCampgrounds) {
            Campground.count().exec(function (err, count) {
                if (err) {
                    console.log(err);
                } else {
                    res.render("campgrounds/index", {
                        campgrounds: allCampgrounds,
                        current: pageNumber,
                        pages: Math.ceil(count / perPage),
                        noMatch: noMatch,
                        search: false
                    });
                }
            });
        });
    }
});

// create

router.post("/", middleware.isLoggedIn, upload.single('image'), function(req, res) {
       cloudinary.v2.uploader.upload(req.file.path, function(err, result) {
      if(err) {
        req.flash('error', err.message);
        return res.redirect('back');
      }
      // add cloudinary url for the image to the campground object under image property
   
          req.body.campground.image = result.secure_url;
           // add image's public_id to campground object
          req.body.campground.imageId = result.public_id;
          // add author to campground
          req.body.campground.author = {
            id: req.user._id,
            username: req.user.username
          };
          Campground.create(req.body.campground, function(err, campground) {
              
            if (err) {
              req.flash('error', err.message);
              return res.redirect('back');
            }
            res.redirect('/campgrounds/' + campground.id);
          });
        });
       
});
// new

router.get("/new", middleware.isLoggedIn, function(req, res){
    res.render("campgrounds/new");
});
// shows campground info 

router.get("/:id", function(req, res){
    //find the campground with provided ID
    Campground.findById(req.params.id).populate("comments").populate({
        path:"reviews",
        options: {sort: {createdAt: -1}}
    }).exec(function(err, foundCampground){
        if(err || !foundCampground){
            req.flash("error", "Campground not found!");
            res.redirect("back");
        }else{
            console.log(foundCampground);
            res.render("campgrounds/show", {campground:foundCampground});
        }
    });
});
// edit campground route
router.get("/:id/edit", middleware.checkCampgroundOwnership, function(req, res){
        Campground.findById(req.params.id, function(err, foundCampground){
            if (err){
                console.log(err);
            }
           res.render("campgrounds/edit", {campground: foundCampground});
        });
   });
   
   
   
// update route
router.put("/:id", middleware.checkCampgroundOwnership, upload.single("image"), function(req, res){
    // delete req.body.campground.rating; //for review
    Campground.findById(req.params.id, async function(err, campground){
        if(err){
            req.flash("error", err.message);
            res.redirect("back");
        } else {
            if (req.file) {
              try {
                  await cloudinary.v2.uploader.destroy(campground.imageId);
                  var result = await cloudinary.v2.uploader.upload(req.file.path);
                  campground.imageId = result.public_id;
                  campground.image = result.secure_url;
              } catch(err) {
                  req.flash("error", err.message);
                  return res.redirect("back");
              }
            }
            campground.name = req.body.name;
            campground.description = req.body.description;
            campground.price = req.body.price;
            campground.save();
            req.flash("success","Successfully Updated!");
            res.redirect("/campgrounds/" + campground._id);
        }
    });
});

// destroy


router.delete('/:id', middleware.checkCampgroundOwnership, function(req, res) {
  Campground.findById(req.params.id, async function(err, campground) {
    if(err) {
      req.flash("error", err.message);
      return res.redirect("back");
    } else {
      Comment.remove({"_id": {$in: campground.comments}}, function (err) {
        if (err) {
          console.log(err);
          return res.redirect("/campgrounds");
        }
        // deletes all reviews associated with the campground
        Review.remove({"_id": {$in: campground.reviews}}, async function (err) { // you need to add async to functions inside which you use await
          if (err) {
            console.log(err);
            return res.redirect("/campgrounds");
          }
          // you need to move the try-catch code to deal with the cludinary image here, to make sure it executes last, after the previous mongoose queries
        try {
            await cloudinary.v2.uploader.destroy(campground.imageId);
            campground.remove();
            req.flash('success', 'Campground deleted successfully!');
            res.redirect('/campgrounds');
        } catch(err) {
            if(err) {
              req.flash("error", err.message);
              return res.redirect("back");
            }
        }
      });
    });
     }
  });
});

// fuzzy search
function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router;
