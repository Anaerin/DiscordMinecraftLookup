"use strict";
import express from "express";
import expressSession from "express-session";
import path from "path";

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
		next();
	}
}
let routes = new Routes();

app.use((err, req, res, next) => {
	res.status(500);
	res.send(`Something went wrong, please inform Anaerin: ${err.stack}`);
});

app.get("/", routes.Root);
export default app;