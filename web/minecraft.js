import log from "../lib/log.js";
import axios from "axios";
import db from "../lib/db.js";
import spawn from "child_process";
import config from "../config.js";
import path from "path";

const getter = axios.create()

const database = new db();

export function getMCUsername(req, res) {
	if (!req.session.isLoggedIn) {
		res.redirect("/");
		return;
	}
	if (req.session.userRecord && req.session.userRecord.minecraftUser && req.session.userRecord.minecraftUser.id) {
		// We already have the minecraft UserID...?
		res.redirect("/mcUserStatus");
		return;
	}
	res.render("mcUserRequest");
}
export async function postMCUsername(req, res) {
	if (!req.session.isLoggedIn) {
		res.redirect("/");
		return;
	}
	if (req.session.userRecord && req.session.userRecord.minecraftUser && req.session.userRecord.minecraftUser.id) {
		// We already have the minecraft UserID...?
		res.redirect("/mcUserStatus");
		return;
	}
	try {
		let mcUserdetails = await axios.get("https://api.mojang.com/users/profiles/minecraft/" + req.data.username);
	} catch (error) {
		log.error(`Problem with getting MC user details: ${error}`);
		res.render("main", {
			title: "Error",
			content: `Error getting MC user details\n<br><pre>${error}</pre>`
		});
	}
	let userRecord = database.getByID(req.session.userRecord.id);
	userRecord.minecraftUser.id = makeDashedUUID(mcUserdetails.id);
	userRecord.minecraftUser.name = mcUserdetails.name;
	database.update(userRecord);
	req.session.userRecord = userRecord;
	res.redirect("/mcUserStatus");
	
}

function updateWhitelist(id, name) {
	let rawFile = await fs.readFile(path.join(config.mcServerPath,config.mcServerName,"whitelist.json"));
	let JSONFile = JSON.parse(rawFile);
	JSONFile.forEach((entry) => {
		let record = database.getByMinecraftID(entry.uuid);
		if (!record) record = database.createNew();
		record.whitelisted = true;
		record.minecraftUser.id = entry.uuid;
		record.minecraftUser.name = entry.name;
		database.update(record, true);
	});
	if (!JSONFile.some((elem) => elem.uuid == id)) {
		JSONFile.push({
			"uuid": id, 
			"name": name
		});
	}
	let record = database.getByMinecraftID(id);
	record.whitelisted = true;
	database.update(record); //Update the DB
	fs.writeFileSync(path.join(config.mcServerPath, config.mcServerName, "whitelist.json"), JSON.stringify(JSONFile,null,2)); //And the whitelist.
	const screen = spawn("screen", ["-S","mc-PhoenixsAssortedGoodies","-p","0","-X","stuff","/whitelist reload^M"],{
		cwd: path.join(config.mcServerPath, config.mcServerName),
		uid: config.uid,
		gid: config.gid
	});
	screen.stdout.on("data", (data) => {
		log.info(`Screen STDOUT: ${data}`);
	});
	screen.stderr.on("data", (data) => {
		log.warn(`Screen STDERR: ${data}`);
	});
	screen.on("close", (code) => {
		log.info(`Screen closed with code ${code}`);
	});
	screen.on("error", (error) => {
		log.error(`Error calling screen: ${error}`);
	});
}

function makeDashedUUID(dashlessUUID) {
	return dashlessUUID.substr(0,8)+"-"+dashlessUUID.substr(8,4)+"-"+dashlessUUID.substr(12,4)+"-"+dashlessUUID.substr(16,4)+"-"+dashlessUUID.substr(20);
}