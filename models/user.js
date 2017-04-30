"use strict";

var bcrypt = require("bcrypt-nodejs");

module.exports = function (mongoose) {
    var Schema = mongoose.Schema;

    var User = new Schema({
        username: {
            type: String,
            required: true,
            unique: true
        },
        firstname: String,
        lastname: String,
        password: {
            type: String,
            required: true,
            select: false
        },
        email: {
            type: String,
            required: true,
            unique: true
        }
    });

    User.pre("save", function (next) {
        var user = this;

        // If password is not modified, no need to generate hash again.
        if (!user.isModified("password")) {
            next();
        } else {
            // Generate the hash.
            bcrypt.hash(user.password, null, null, function (err, hash) {
                if (err) {
                    next(err);
                }

                user.password = hash; // Set password to hash version.
                next();
            });
        }
    });

    User.methods.comparePassword = function (passw) {
        // Use Sync version since user isn't allowed to continue until password
        // is either verified or rejected.
        return bcrypt.compareSync(passw, this.password);
    };

    return mongoose.model("User", User);
};