import log from "../lib/log.js";
import axios from "axios";
import db from "../lib/db.js";
import spawn from "child_process";
import config from "../config.js";
import path from "path";
import { isInGuild } from "../lib/util.js";

const getter = axios.create()

const database = new db();

export function getMCUsername(req, res) {
	if (!req.session.isLoggedIn) {
		res.redirect("/");
		return;
	}
	if (!isInGuild(req.session.userRecord)) {
		res.redirect("/notInGuild");
		return;
	}
	if (req?.session?.userRecord?.minecraftUser?.id) {
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
	if (!isInGuild(req.session.userRecord)) {
		res.redirect("/notInGuild");
		return;
	}
	if (req?.session?.userRecord?.minecraftUser?.id) {
		// We already have the minecraft UserID...?
		res.redirect("/mcUserStatus");
		return;
	}
	let mcUserdetails;
	try {
		mcUserdetails = await axios.get("https://api.mojang.com/users/profiles/minecraft/" + req.data.username);
	} catch (error) {
		log.error(`Problem with getting MC user details: ${error}`);
		res.render("main", {
			title: "Error",
			content: `Error getting MC user details\n<br><pre>${error}</pre>`
		});
		return;
	}
	let mcUser;
	//Dirty trick here. Assignment is truthy based on value assigned.
	while (mcUser = database.getByMinecraftID(makeDashedUUID(mcUserdetails.id))) { //No, I don't mean ==.
		database.delete(mcUser.id);
	}
	let userRecord = database.getByID(req.session.userRecord.id);
	userRecord.minecraftUser.id = makeDashedUUID(mcUserdetails.id);
	userRecord.minecraftUser.name = mcUserdetails.name;
	database.update(userRecord, true);
	req.session.userRecord = userRecord;
	await updateWhitelist(req.session.userRecord.id, req.session.userRecord.name);
	res.redirect("/mcUserStatus");
}
export async function getMCUserStatus(req, res) {
	if (!req.session.isLoggedIn) {
		res.redirect("/");
		return;
	}
	if (!isInGuild(req.session.userRecord)) {
		res.redirect("/notInGuild");
		return;
	}	
	if (!(req?.session?.userRecord?.minecraftUser?.id)) {
		// We don't have the minecraft UserID...?
		res.redirect("/mcUserRequest");
		return;
	}
	let banList = await readBanList();
	banRecord = banList.find((elem) => elem.uuid == req.session.userRecord.minecraftUser.id);
	if (banRecord) req.session.userRecord.ban = banRecord;
	
}

async function readBanList() {
	let rawFile = await fs.readFile(path.join(config.mcServerPath, config.mcServerName, "banned-players.json"));
	let JSONFile = JSON.parse(rawFile);
	return JSONFile;
}

async function updateWhitelist(id, name) {
	let rawFile = await fs.readFile(path.join(config.mcServerPath, config.mcServerName, "whitelist.json"));
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