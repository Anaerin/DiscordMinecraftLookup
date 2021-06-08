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

app.use((req, res, next) => {
	if (req.session.loggedIn) {
		req.session.user = "Blah";
		res.locals.loggedIn = false;
		res.locals.menu = [{
			name: "Logout",
			url: "/logout"
		}];
	} else {
		res.locals.loggedIn = false;
		res.locals.menu = [{
			name: "Login",
			url: "/login"
		}];
	}
	return next();
});

class Routes {
	constructor() {

	}
	Root = (req, res, next) => {
		res.render("main",{
			title: "Homepage",
			content: `Things go here. Not yet, but eventually.`
		});
		return next();
	}
	CSS = express.static("web/css");
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
app.get("/css", routes.CSS);
app.use((req, res, next) => {
	res.status(404);
	res.render("main", {
		title: "Error",
		content: `Couldn't find page ${req.path}`
	});
	return next();
});
export default app;