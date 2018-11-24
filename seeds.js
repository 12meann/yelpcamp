var mongoose = require("mongoose");
var Campground = require("./models/campground");
var Comment = require("./models/comment");

var data =[
    {name: "Cloud's Rest",
    image: "https://cdn.pixabay.com/photo/2015/09/14/13/57/campground-939588_960_720.jpg",
    desctiption: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque sed porttitor leo. Donec feugiat ultricies semper. Sed efficitur eget tortor eleifend semper. Mauris dapibus efficitur velit quis tempus. Fusce tincidunt lacus non lacus scelerisque, ut pretium justo vehicula. Aenean blandit ipsum vulputate libero tempus finibus. Mauris et imperdiet dolor. Sed vitae consectetur nisi. Sed vitae commodo sem. Integer consequat urna et ornare dapibus. Sed pellentesque mattis nisi, eget molestie dolor suscipit a."
    },
    {
        name: "Desert Moana",
        image: "https://cdn.pixabay.com/photo/2016/01/26/23/32/camp-1163419_960_720.jpg", 
        description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque sed porttitor leo. Donec feugiat ultricies semper. Sed efficitur eget tortor eleifend semper. Mauris dapibus efficitur velit quis tempus. Fusce tincidunt lacus non lacus scelerisque, ut pretium justo vehicula. Aenean blandit ipsum vulputate libero tempus finibus. Mauris et imperdiet dolor. Sed vitae consectetur nisi. Sed vitae commodo sem. Integer consequat urna et ornare dapibus. Sed pellentesque mattis nisi, eget molestie dolor suscipit a."
    },
    {
        name: "Glacier camp",
        image: "https://cdn.pixabay.com/photo/2014/11/27/18/36/tent-548022_960_720.jpg", 
        description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque sed porttitor leo. Donec feugiat ultricies semper. Sed efficitur eget tortor eleifend semper. Mauris dapibus efficitur velit quis tempus. Fusce tincidunt lacus non lacus scelerisque, ut pretium justo vehicula. Aenean blandit ipsum vulputate libero tempus finibus. Mauris et imperdiet dolor. Sed vitae consectetur nisi. Sed vitae commodo sem. Integer consequat urna et ornare dapibus. Sed pellentesque mattis nisi, eget molestie dolor suscipit a."
    }
    ]
function seedDB(){
    // remove all campgrounds
Campground.remove({}, function(err){
    if(err){
        console.log(err)
    }
    console.log("removed campgrounds");
    data.forEach(function(seed){
        Campground.create(seed, function(err, campground){
            if(err){
                console.log(err)
            }else {
                console.log("added a campground");
                Comment.create(
                {
                    text:"this place is great but I wish there was net",
                    author: "Homer"
                }, function(err, comment){
                    if(err){
                        console.log(err);
                    }else {
                    campground.comments.push(comment);
                    campground.save();
                    console.log("Created new comment");
                }
                })
            }
        })
    });
    });
    
}

module.exports = seedDB;