/*
*
*
*       Complete the API routing below
*
*
*/

"use strict";

// const expect = require("chai").expect;
const Thread = require("../models/Thread.js");
const mongoose = require("mongoose");

/* eslint-disable no-console */
mongoose.connect(
	process.env.DB,
	function(err) {
		if (err) {
			console.log(err);
		} else {
			console.log("MongoDB connected");
		}
	}
);

module.exports = function(app) {
	app
		.route("/api/threads/:board")
		.get(async (req, res) => {
			const threads = await Thread.find(
				{ board: req.params.board },
				{
					delete_password: 0,
					reported: 0,
					"replies.delete_password": 0,
					"replies.reported": 0
				},
				{
					limit: 10,
					sort: { created_on: -1, "replies.created_on": -1 }
				}
			);
			const threadsFiltered = threads.map(thread => {
				let object = {
					...thread.toObject(),
					replycount: thread.replies.length,
					replies: thread.replies.slice(0, 3)
				};
				return object;
			});
			return res.json(threadsFiltered);
		})
		.post(async (req, res) => {
			let { text, delete_password, board } = req.body;
			board = board ? board : req.params.board;
			const newThread = new Thread({ board, text, delete_password });
			const updatedThread = await newThread
				.save()
				.catch(err => res.status(404).json(err));
			if (process.env.NODE_ENV === "testing") {
				return res.json(updatedThread);
			} else {
				return res.redirect("/b/general/");
			}
		})
		.put(async (req, res) => {
			const { report_id /*, board*/ } = req.body;
			// board = board ? board : req.params.board;
			// updateOne() return the information about the operation
			await Thread.updateOne({ _id: report_id }, { $set: { reported: true } });
			return res.send("success");
		})
		.delete(async (req, res) => {
			const { thread_id, delete_password /*board,*/ } = req.body;
			// board = board ? board : req.params.board;
			let thread = await Thread.findById({ _id: thread_id }).catch(err =>
				res.status(404).json(err)
			);
			let threadPassword = thread.delete_password;
			if (threadPassword === delete_password) {
				await Thread.updateOne(
					{ _id: thread_id },
					{ $set: { text: "[deleted]" } }
				).catch(err => res.status(404).json(err));
				return res.send("success");
			} else {
				return res.status(404).json({ error: "Invalid Password" });
			}
		});

	app
		.route("/api/replies/:board")
		.get(async (req, res) => {
			const thread_id = req.query.thread_id;
			const threads = await Thread.findById(thread_id, {
				delete_password: 0,
				reported: 0,
				"replies.delete_password": 0,
				"replies.reported": 0
			});
			return res.json(threads);
		})
		.post(async (req, res) => {
			const { text, delete_password, thread_id /*, board*/ } = req.body;
			// board = board ? board : req.params.board;
			const thread = await Thread.findById(thread_id).catch(err =>
				res.status(404).json(err)
			);
			const newReply = { text, delete_password };
			thread.replies.unshift(newReply);
			thread.bumped_on = Date.now();
			const updatedThread = await thread
				.save()
				.catch(err => res.status(404).json(err));
			return res.json(updatedThread);
		})
		.put(async (req, res) => {
			try {
				const { thread_id, reply_id } = req.body;
				const thread = await Thread.findById(thread_id).catch(err =>
					res.status(404).json(err)
				);
				const index = thread.replies.map(x => x.id).indexOf(reply_id);
				console.log(index);
				thread.replies[index].reported = true;
				const updatedThread = await thread
					.save()
					.catch(err => res.status(404).json(err));
				return res.json(updatedThread);
			} catch (error) {
				console.log(error);
			}
		})
		.delete(async (req, res) => {
			const { thread_id, reply_id, delete_password } = req.body;
			let thread = await Thread.findById(thread_id).catch(err =>
				res.status(404).json(err)
			);
			const index = thread.replies.map(x => x.id).indexOf(reply_id);

			let replyPassword = thread.replies[index].delete_password;
			if (replyPassword === delete_password) {
				thread.replies[index].text = "[deleted]";
				const updatedThread = await thread
					.save()
					.catch(err => res.status(404).json(err));
				return res.json(updatedThread);
			} else {
				return res.status(404).json({ error: "Invalid Password" });
			}
		});
};
