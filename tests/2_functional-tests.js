/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       (if additional are added, keep them at the very end!)
*/

var chaiHttp = require("chai-http");
var chai = require("chai");
var assert = chai.assert;
var server = require("../server");

// Require Model
var Thread = require("../models/Thread.js");

chai.use(chaiHttp);
/*eslint-disable no-undef, no-console*/
suite("Functional Tests", function() {
	let thread_id;
	before(() => {
		return new Promise((resolve, reject) => {
			Thread.deleteMany({})
				.then(() => {
					resolve();
				})
				.catch(err => reject(err));
		});
	});
	suite("API ROUTING FOR /api/threads/:board", function() {
		suite("POST", function() {
			test("Create a thread", function(done) {
				chai
					.request(server)
					.post("/api/threads/general")
					.send({ text: "Mocha test", delete_password: "123" })
					.end(function(err, res) {
						let data = res.body;
						// Save Thread Id in a "global" variable
						thread_id = data._id;

						assert.equal(res.status, 200);
						assert.equal(data.text, "Mocha test");
						assert.equal(data.board, "general");
						assert.isNotNull(data.created_on);
						assert.isNumber(Date.parse(data.created_on));
						assert.isNotNull(data.bumped_on);
						assert.isNumber(Date.parse(data.bumped_on));
						assert.equal(data.reported, false);
						assert.isBoolean(data.reported);
						assert.exists(data.delete_password);
						assert.isArray(data.replies);
						if (err) {
							console.log(err);
						}
						done();
					});
			});
		});

		suite("GET", function() {
			test("Get array of threads", function(done) {
				chai
					.request(server)
					.get("/api/threads/general")
					.end(function(err, res) {
						let data = res.body[0];
						assert.equal(res.status, 200);
						assert.equal(data.text, "Mocha test");
						assert.equal(data.board, "general");
						assert.isNotNull(data.created_on);
						assert.isNumber(Date.parse(data.created_on));
						assert.isNotNull(data.bumped_on);
						assert.isNumber(Date.parse(data.bumped_on));
						assert.isArray(data.replies);
						assert.notExists(data.reported);
						assert.notExists(data.delete_password);
						if (err) {
							console.log(err);
						}
						done();
					});
			});
		});

		suite("DELETE", function() {
			test("Delete thread", function(done) {
				chai
					.request(server)
					.delete("/api/threads/general")
					.send({ thread_id, delete_password: "123" })
					.end(function(err, res) {
						assert.equal(res.status, 200);
						assert.equal(res.text, "success");
						if (err) {
							console.log(err);
						}
						chai
							.request(server)
							.get("/api/threads/general")
							.end(function(err, res) {
								assert.equal(res.status, 200);
								assert.equal(res.body[0].text, "[deleted]");
								done();
							});
					});
			});
		});

		suite("PUT", function() {
			test("Report thread", function(done) {
				chai
					.request(server)
					.put("/api/threads/general")
					.send({ report_id: thread_id })
					.end(function(err, res) {
						assert.equal(res.status, 200);
						assert.equal(res.text, "success");
						if (err) {
							console.log(err);
						}
						done();
					});
			});
		});
	});

	suite("API ROUTING FOR /api/replies/:board", function() {
		let reply_id;
		suite("POST", function() {
			test("Create reply to a thread", function(done) {
				chai
					.request(server)
					.post("/api/replies/general")
					.send({ text: "Mocha Reply Test", delete_password: "123", thread_id })
					.end(function(err, res) {
						let data = res.body.replies[0];
						assert.equal(res.status, 200);
						assert.isArray(res.body.replies);
						assert.equal(res.body.replies.length, 1);
						assert.isTrue(res.body.reported);
						// Reply
						reply_id = data._id;
						assert.equal(data.text, "Mocha Reply Test");
						// Reply - Reported
						assert.equal(data.reported, false);
						assert.isBoolean(data.reported);
						// Reply - Password
						assert.exists(data.delete_password);
						assert.equal(data.delete_password, "123");
						if (err) {
							console.log(err);
						}
						done();
					});
			});
		});

		suite("GET", function() {
			test("Get one thread with its replies", function(done) {
				chai
					.request(server)
					.get("/api/replies/general")
					.query({ thread_id })
					.end(function(err, res) {
						let data = res.body;
						assert.equal(res.status, 200);
						assert.equal(data.text, "[deleted]");
						assert.equal(data.board, "general");
						// Thread - Dates
						assert.isNotNull(data.created_on);
						assert.isNumber(Date.parse(data.created_on));
						assert.isNotNull(data.bumped_on);
						assert.isNumber(Date.parse(data.bumped_on));
						assert.isArray(data.replies);
						// No Reported nor delete_password
						assert.notExists(data.reported);
						assert.notExists(data.delete_password);
						// Reply
						assert.equal(data.replies[0].text, "Mocha Reply Test");
						assert.notExists(data.replies[0].reported);
						assert.notExists(data.replies[0].delete_password);
						if (err) {
							console.log(err);
						}
						done();
					});
			});
		});

		suite("PUT", function() {
			test("Report reply", function(done) {
				chai
					.request(server)
					.put("/api/replies/general")
					.send({ thread_id, reply_id })
					.end(function(err, res) {
						assert.equal(res.status, 200);
						assert.equal(res.body.replies[0].reported, true);
						if (err) {
							console.log(err);
						}
						done();
					});
			});
		});

		suite("DELETE", function() {
			test("Delete a reply", function(done) {
				chai
					.request(server)
					.delete("/api/replies/general")
					.send({ thread_id, reply_id, delete_password: "123" })
					.end(function(err, res) {
						assert.equal(res.status, 200);
						assert.equal(res.body.replies[0].text, "[deleted]");
						if (err) {
							console.log(err);
						}
						done();
					});
			});
		});
	});
});
