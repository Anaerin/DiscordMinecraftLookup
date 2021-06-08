"use strict";
import express from "express";
import expressSession from "express-session";
import path from "path";
import log from "../lib/log.js";

const app = express();
app.set("view engine", "ejs");
app.set("views", path.join(__dirname,"/views"));
app.set("trust proxy", 1);

app.use(expressSession({
	secret: "SomeSecretValue",
	saveUninitialized: false
}));

class Routes {
	constructor() {

	}
	Root = (req, res, next) => {
		res.send("Hello world!");
		return next();
	}
}
let routes = new Routes();

app.use((err, req, res, next) => {
	res.status(500);
	res.render("main", {
		title: "Error",
		content: `An error occurred. Please inform Anaerin\n<br><pre>${err.stack}</pre>`
	});
	log.error(`Error occurred accessing ${req.originalUrl}: ${err.stack}`);
	return next();
});

app.get("/", routes.Root);
export default app;