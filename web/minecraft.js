import log from "../lib/log.js";
import axios from "axios";
import db from "../lib/db.js";
import { spawn } from "child_process";
import config from "../config.js";
import path from "path";
import fs from "fs";
import { isInGuild } from "../lib/util.js";

const getter = axios.create()

const database = new db();

export function getMCUsername(req, res) {
	if (!req.session.isLoggedIn) {
		res.redirect("/");
		return;
	}
	if (!req?.session?.userRecord?.discordUser?.isInGuild) {
		res.redirect("/notInGuild");
		return;
	}
	if (req?.session?.userRecord?.minecraftUser?.id) {
		// We already have the minecraft UserID...?
		res.redirect("/mcUserStatus");
		return;
	}
	res.render("mcUserRequest", {
		title: "Minecraft Username",
		content: "Please enter your minecraft username"
	});
}
export async function postMCUsername(req, res) {
	if (!req.session.isLoggedIn) {
		res.redirect("/");
		return;
	}
	if (!req?.session?.userRecord?.discordUser?.isInGuild) {
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
		mcUserdetails = await axios.get("https://api.mojang.com/users/profiles/minecraft/" + req.body.username);
	} catch (error) {
		log.error(`Problem with getting MC user details: ${error}`);
		res.render("main", {
			title: "Error",
			content: `Error getting MC user details\n<br><pre>${error}</pre>`
		});
		return;
	}
	const mcID = makeDashedUUID(mcUserdetails.data.id);
	const mcName = mcUserdetails.data.name;
	let mcUser;
	mcUser = database.getByMinecraftID(mcID);
	if (mcUser && mcUser.id != req.session.userRecord.id) { 
		res.render("mcUserRequest", {
			title: "Minecraft Username",
			content: "<strong>That username is claimed by someone else</strong><br>Please enter your minecraft username"
		});
		return;
	}
	/*
	//Dirty trick here. Assignment is truthy based on value assigned.
	while (mcUser = database.getByMinecraftID(mcID)) { //No, I don't mean ==.
		database.delete(mcUser.id);
	}
	*/
	let userRecord = database.getByID(req.session.userRecord.id);
	if (!userRecord) {
		log.error(`Couldn't get user ID ${req.session.userRecord.id}`);
	}
	userRecord.minecraftUser.id = mcID;
	userRecord.minecraftUser.name = mcName;
	database.update(userRecord, true);
	req.session.userRecord = userRecord;
	await updateWhitelist(userRecord.id, mcID, mcName);
	res.redirect("/mcUserStatus");
}
export async function getMCUserStatus(req, res) {
	if (!req.session.isLoggedIn) {
		res.redirect("/");
		return;
	}
	if (!req?.session?.userRecord?.discordUser?.isInGuild) {
		res.redirect("/notInGuild");
		return;
	}	
	if (!(req?.session?.userRecord?.minecraftUser?.id)) {
		// We don't have the minecraft UserID...?
		res.redirect("/mcUserRequest");
		return;
	}
	let banList = await readBanList();
	let banRecord = banList.find((elem) => elem.uuid == req.session.userRecord.minecraftUser.id);
	if (banRecord) req.session.userRecord.ban = banRecord;
	res.locals.userRecord = req.session.userRecord;
	res.render("mcUserStatus", {
		title: "Status",
		content: ""
	});
	return;
}

async function readBanList() {
	let rawFile = fs.readFileSync(path.join(config.mcServerPath, config.mcServerName, "banned-players.json"));
	let JSONFile = JSON.parse(rawFile);
	return JSONFile;
}

async function updateWhitelist(id, mcID, mcName) {
	let rawFile = fs.readFileSync(path.join(config.mcServerPath, config.mcServerName, "whitelist.json"));
	let JSONFile = JSON.parse(rawFile);
	if (!JSONFile.some((elem) => elem.uuid == mcID)) {
		JSONFile.push({
			"uuid": mcID, 
			"name": mcName
		});
	}
	let record = database.getByID(id);
	record.whitelisted = true;
	database.update(record); //Update the DB
	fs.writeFileSync(path.join(config.mcServerPath, config.mcServerName, "whitelist.json"), JSON.stringify(JSONFile,null,2)); //And the whitelist.
	/* 
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
	*/
}

function makeDashedUUID(dashlessUUID) {
	return dashlessUUID.substr(0,8)+"-"+dashlessUUID.substr(8,4)+"-"+dashlessUUID.substr(12,4)+"-"+dashlessUUID.substr(16,4)+"-"+dashlessUUID.substr(20);
}