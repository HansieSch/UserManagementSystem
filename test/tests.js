"use strict";

var superagent = require("superagent");
var expect = require("expect.js");
//var nodemon = require("nodemon");

// Test user management system routes.
describe("User Management System", function () {

    /*before(function (done) {
        nodemon({
            script: "server.js",
            ext: "js"
        });

        nodemon.on("start", function () {
            console.log("Test server started.");
            done();
        });
    });*/
    
    var testServerUrl = "http://127.0.0.1:3000/api/user";
    var user1 = {
        username: "will",
        firstname: "William",
        lastname: "White",
        password: "bazinga",
        email: "willwhite@gmail.com"
    };
    
    var userID;

    // Tests for public routes.
    describe("public access", function () {

        describe("create new users", function () {
            // Should return success when all correct values have been passed.
            it("should successfully create new user", function (done) {
                superagent
                    .post(testServerUrl)
                    .send(user1)
                    .end(function (err, res) {
                        expect(err).to.equal(null);
                        expect(res.status).to.eql(200);
                        expect(res.body.user).to.not.eql(undefined);
                        expect(res.body.success).to.be(true);
                        expect(user1.username).to.equal(res.body.user.username);
                        expect(user1.firstname).to.equal(res.body.user.firstname);
                        expect(user1.lastname).to.equal(res.body.user.lastname);
                        expect(res.body.user._id).to.not.equal(undefined);
                        userID = res.body.user._id;
                        done();
                    });
            });

            // Not all required field values are passed.
            it("should fail to create new user", function (done) {
                superagent
                    .post(testServerUrl)
                    .send(user1)
                    .end(function (err, res) {
                        expect(res.body.user).to.eql(undefined);
                        expect(res.body.success).to.be(false);
                        expect(res.body.error).to.not.equal(undefined);
                        done();
                    });
            });

        });

        describe("retrieve all users in database", function () {
            it ("should return an array containing all users", function (done) {
                superagent
                    .get(testServerUrl)
                    .end(function (err, res) {
                        expect(err).to.eql(null);
                        expect(res.body.users.length).to.not.be(undefined);
                        done();
                    });
            });
        });

        describe("authenticate existing users", function () {
            // Success
            it("should receive token", function (done) {
                superagent
                    .post(testServerUrl + "/authenticate")
                    .send({
                        username: "tommy",
                        password: "tommy"
                    })
                    .end(function (err, res) {
                        expect(err).to.eql(null);
                        expect(res.status).to.eql(200);
                        expect(res.body.success).to.be(true);
                        expect(res.body.token).to.not.eql(undefined);
                        expect(res.body.token).to.not.eql(null);
                        done();
                    });
            });

            // Wrong password.
            it("should receive error message: Wrong password", function (done) {
                superagent
                    .post(testServerUrl + "/authenticate")
                    .send({
                        username: "tommy",
                        password: "tom"
                    })
                    .end(function (err, res) {
                        expect(res.body.success).to.be(false);
                        expect(res.body.error).to.not.eql(undefined);
                        done();
                    });
            });

            // Wrong username
            it("should receive error message: Wrong username", function (done) {
                superagent
                    .post(testServerUrl + "/authenticate")
                    .send({
                        username: "tom",
                        password: "tommy"
                    })
                    .end(function (err, res) {
                        expect(res.body.success).to.be(false);
                        expect(res.body.error).to.not.eql(undefined);
                        done();
                    });
            });
        });

    });

    describe("authorized access", function () {

        var token;
        var remUser = {
            username: "user332",
            firstname: "Donkey",
            lastname: "Kong",
            password: "KingKong",
            email: "climbit@empire.com"
        };

        before(function (done) {
            var moveOn = false;

            superagent
                .post(testServerUrl + "/authenticate")
                .send({
                    password: "tommy",
                    username: "tommy"
                })
                .end(function (err, res) {
                    token = res.body.token;
                    if (moveOn) {
                        done();
                    } else {
                        moveOn = true;
                    }
                });

            superagent
                .post(testServerUrl)
                .send(remUser)
                .end(function (err, res) {
                    remUser = res.body.user;
                    if (moveOn) {
                        done();
                    } else {
                        moveOn = true;
                    }
                });
        });

        describe("edit specific user", function () {

            it("should successfully edit user", function (done) {
                superagent
                    .put(testServerUrl + "/" + userID)
                    .send({
                        firstname: "editted"
                    })
                    .set("x-access-token", token)
                    .end(function (err, res) {
                        expect(err).to.eql(null);
                        expect(res.body.success).to.be(true);
                        expect(res.status).to.be(200);
                        expect(res.body.user.firstname).to.eql("editted");
                        done();
                    });
            });

            // illegal id
            it("should fail to edit user information", function (done) {
                superagent
                    .put(testServerUrl + "/" + userID + "3")
                    .send({
                        firstname: "edit"
                    })
                    .set("x-access-token", token)
                    .end(function (err, res) {
                        expect(err).to.eql(null);
                        expect(res.body.success).to.be(false);
                        expect(res.body.error).to.not.eql(undefined);
                        done();
                    });
            });

            it("should fail due to invalid token", function (done) {
                superagent
                    .put(testServerUrl + "/" + userID)
                    .send({
                        firstname: "willy"
                    })
                    .set("x-access-token", token.toLowerCase())
                    .end(function (err, res) {
                        expect(err).to.eql(null);
                        expect(res.body.success).to.be(false);
                        expect(res.body.error).to.not.eql(undefined);
                        done();
                    });
            });
        });

        describe("get specific user", function () {

            it("should retrieve specific user information", function (done) {
                superagent
                    .get(testServerUrl + "/" + userID)
                    .set("x-access-token", token)
                    .end(function (err, res) {
                        expect(err).to.eql(null);
                        expect(res.body.success).to.be(true);
                        expect(res.body.user._id).to.eql(userID);
                        done();
                    });
            });

            // illegal id
            it("should fail to retrieve user information due to illegal id value", function (done) {
                superagent
                    .get(testServerUrl + "/" + userID + "d")
                    .set("x-access-token",token)
                    .end(function (err, res) {
                        expect(err).to.eql(null);
                        expect(res.body.success).to.be(false);
                        expect(res.body.error).to.not.eql(undefined);
                        done();
                    });
            });

            it("should fail due to invalid token", function (done) {
                superagent
                    .get(testServerUrl + "/" + userID)
                    .set("x-access-token", token.toLowerCase())
                    .end(function (err, res) {
                        expect(err).to.eql(null);
                        expect(res.body.success).to.be(false);
                        expect(res.body.error).to.not.eql(undefined);
                        done();
                    });
            });
        });

        describe("remove specific user", function () {

            it("should successfully remove user", function (done) {
                superagent
                    .delete(testServerUrl + "/" + remUser._id)
                    .set("x-access-token",token)
                    .end(function (err, res) {
                        expect(err).to.eql(null);
                        expect(res.body.success).to.be(true);
                        done();
                    });
            });

            // wrong id
            it("should fail to remove user due to invalid id", function (done) {
                superagent
                    .delete(testServerUrl + "/" + remUser._id + "677")
                    .set("x-access-token",token)
                    .end(function (err, res) {
                        expect(err).to.eql(null);
                        expect(res.body.success).to.be(false);
                        expect(res.body.error).to.not.be(undefined);
                        done();
                    });
            });

            it("should fail due to invalid token", function (done) {
                superagent
                    .delete(testServerUrl + "/" + remUser._id)
                    .set("x-access-token", token.toLowerCase())
                    .end(function (err, res) {
                        expect(err).to.eql(null);
                        expect(res.body.success).to.be(false);
                        expect(res.body.error).to.not.be(undefined);
                        done();
                    });
            });
        });

        after(function (done) {
            superagent
                .delete(testServerUrl + "/" + userID)
                .set("x-access-token", token)
                .end(function (err, res) {
                    if (err) {
                        console.log(err);
                    }
                    done();
                });
        });
    });
});