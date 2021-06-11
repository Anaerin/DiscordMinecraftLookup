"use strict";
import express from "express";
import expressSession from "express-session";
import expressWinston from "express-winston";
import path from "path";
import log from "../lib/log.js";
import { fileURLToPath } from "url";
import { oAuth, code } from "../oauth.js";

const app = express();
app.set("view engine", "ejs");
app.set("views", path.join(path.dirname(fileURLToPath(import.meta.url)),"/views"));
app.set("trust proxy", 1);

app.use(expressSession({
	secret: "SomeSecretValue",
	saveUninitialized: false,
	resave: false
}));

app.use(expressWinston.logger({
	winstonInstance: log
}));

app.use(express.urlencoded());

app.use((req, res, next) => {
	if (req.session.loggedIn) {
		res.locals.loggedIn = true;
		res.locals.menu = [{
			name: "Logout",
			url: "/logout"
		}];
		res.locals.displayName = req.session.discordUsername;
		if (req.session.userRecord) res.locals.userRecord = req.session.userRecord;
	} else {
		res.locals.loggedIn = false;
		res.locals.menu = [{
			name: "Login",
			url: "/"
		}];
	}
	log.debug("Applied loggedIn check");
	return next();
});

app.use((err, req, res, next) => {
	res.status(500);
	res.render("main", {
		title: "Error",
		content: `An error occurred. Please inform Anaerin\n<br><pre>${err.stack}</pre>`
	});
	log.error(`Error occurred accessing ${req.originalUrl}: ${err.stack}`);
	return next();
});
app.use("/css", express.static("web/css"));

app.get("/", (req, res) => {
	log.debug("Accessed homepage");
	res.render("main",{
		title: "Homepage",
		content: `Things go here. Not yet, but eventually.`
	});
});
app.get("/logout", (req, res) => {
	req.session.destroy((err) => {
		if (err) log.error(`Unable to destroy session: ${err}`);
		res.redirect("/");
	});
});

app.get("/login", oAuth);
app.get("/code", code);

app.use((req, res, next) => {
	res.status(404);
	res.render("main", {
		title: "Error",
		content: `Couldn't find page ${req.path}`
	});
	return next();
});
export default app;