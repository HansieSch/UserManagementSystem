"use strict";

var jwt = require("jsonwebtoken");

// express: Express
// opts: Object with adminOnly(Boolean) and dbURL(String) properties.
function UserManager(express, opts) {

    if (opts.mongoose === undefined) {
        throw Error("Mongoose instance required.");
    }
    
    var User = require("./models/user.js")(opts.mongoose);
    
    var settings = {
        adminOnly: opts ? !!opts.adminOnly : false, // Not part of MVP.
        secret: opts ? opts.secret : "supersillysecret",
        mongoose: opts.mongoose
    };
    
    var api = express.Router();
    
    api.route("/user")
        // Return all users in database.
        .get(function (req, res) {
            // Get users from database.
            
            User.find({}, function (err, users) {
                if (err) {
                    res.json({
                        success: false,
                        users: users
                    });
                } else {
                    res.json({
                        success: true,
                        users: users
                    });
                }
            });
        
        })
    
        // Create new user.
        .post(function (req, res) {
            // Create new user.
            // Save newly created user to database.
            var user = new User({
                username: req.body.username,
                firstname: req.body.firstname,
                lastname: req.body.lastname,
                password: req.body.password,
                email: req.body.email
            });
            
            user.save(function (err, user) {
                res.type('application/json'); 
                if (err) {
                    res.json({
                        success: false,
                        error: err
                    });
                } else {
                    res.json({
                        success: true,
                        user: {
                            _id: user._id,
                            username: user.username,
                            firstname: user.firstname,
                            lastname: user.lastname,
                            email: user.email
                        }
                    });
                }
            });
        
        });
    
    api.route("/user/authenticate")
        // Check whether user credentials match an account in database and if
        // successful return a token to be used for authentication.
        .post(function (req, res) {
            // Query user information from database.
            // Check credentials e.i. find user using username and check if password matches.
            // Explicitly select password from database.
            // if user matches return a token and user information.
            // if user password doesn't match return error.

            User.findOne({ username: req.body.username })
                // password field is explicitly selected to ensure the user has it.
                // If not bcrypt fails.
                .select("password username firstname lastname email")
                .exec(function (err, user) {
                    if (err) {
                        res.json({
                            success: false,
                            error: err
                        });
                    } else {
                        if (!user) { // User not found.
                            res.json({
                                success: false,
                                error: "Password/Username doesn't match."
                            });
                        } else if (!user.comparePassword(req.body.password)) {
                            // User password doesn't match.
                            res.json({
                                success: false,
                                error: "Password/Username doesn't match."
                            });
                        } else {
                            // Create token.
                            var token = jwt.sign({
                                _id: user._id,
                                username: user.username,
                                firstname: user.firstname,
                                lastname: user.lastname,
                                email: user.email
                            },
                            settings.secret, {
                                expiresIn: "24h"
                            });

                            res.json({
                                success: true,
                                token: token
                            });
                        }
                    }
                });
        });
    
    // Verification middleware for token authenticity.
    api.use(function (req, res, next) {
        // Check whether user request has a token. If not res with error.
        // if user token doesn't pass verification. return error
        // if user's token is verified add decoded user information to req.user object call next().

        var token = req.headers["x-access-token"] || req.params.token || req.body.token;

        if (token) {
            var valid = jwt.verify(token, settings.secret, function (err, decoded) {
                if (err) {
                    res.json({
                        success: false,
                        error: "Not authenticated."
                    });
                } else {
                    req.user = decoded;
                    next();
                }
            });
        } else {
            res.json({
                success: false,
                error: "Not authenticated."
            });
        }
    });
    
    api.route("/user/:id")
    
        // Return user with matching id.
        .get(function (req, res) {
            // Find user that matches the id passed as parameter.
            // Return user if found. Otherwise return error.
            
            User.findById(req.params.id, function (err, user) {
                if (err) {
                    res.json({
                        success: false,
                        error: err
                    });
                } else if (!err && !user) {
                    res.json({
                        success: false,
                        error: "No user matching that id found."
                    });
                } else {
                    res.json({
                        success: true,
                        user: user
                    });
                }
            });
        
        })
    
        // Update user with matching id.
        .put(function (req, res) {
            // Find user with the matching id value.
            // Update fields supplied by the req.body object. Only update a field if supplied.
            // Save user's updated information to database.
            
            User.findOne({ _id: req.params.id }, function (err, user) {
                // If user doesn't exist.
                if (!err && !user) {
                    res.json({
                        success: false,
                        error: "No user matching that id found."
                    });
                } else if (err) {
                    res.json({
                        success: false,
                        error: err
                    });
                } else {
                
                    if (req.body.username) user.username = req.body.username;
                    if (req.body.firstname) user.firstname = req.body.firstname;
                    if (req.body.lastname) user.lastname = req.body.lastname;
                    if (req.body.password) user.password = req.body.password;
                    if (req.body.email) user.email = req.body.email;
                    
                    // Save changes to database.
                    user.save(function (err, newUserInfo) {
                        if (err) {
                            res.json({
                                success: false,
                                error: err
                            });
                        } else {
                            res.json({
                                success: true,
                                user: {
                                    _id: newUserInfo._id,
                                    username: newUserInfo.username,
                                    firstname: newUserInfo.firstname,
                                    lastname: newUserInfo.lastname,
                                    email: newUserInfo.email
                                }
                            });
                        }
                    });
            
                }
            });
        
        })
    
        // Remove user information from the system.
        .delete(function (req, res) {
            // Find User with matching id.
            // Remove user information from database.
            User.findByIdAndRemove(req.params.id, function (err, user) {
                if (err) {
                    res.json({
                        success: false,
                        error: err
                    });
                } else {
                    res.json({
                        success: true
                    });
                }
            });
    
        });
    
    return api;

}

module.exports = UserManager;