import { ClientCredentials, AuthorizationCode } from "simple-oauth2";
import log from "../lib/log.js";
import axios from "axios";
import db from "../lib/db.js";
import config from "../config.js";

const getter = axios.create({
	baseURL: "https://discord.com/api",
});

function randomCharacters(len) {
	Array.apply(0, Array(len)).map(() => {
		return (function(charset) {
			return charset.charAt(Math.floor(Math.random() * charset.length))
		}("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"));
	}).join("");
}

const oAuthConfig = {
	client: config.discordAuth,
	auth: {
		tokenHost: "discord.com",
		tokenPath: "/api/oauth2/token",
		revokePath: "/api/oauth2/token/revoke",
		authorizePath: "/api/oauth2/authorize"
	}
}

const client = new AuthorizationCode(oAuthConfig);

const database = new db();

export function getDiscordAuthURL(req, res) {
	req.session.state = randomCharacters(25);
	let authConfig = config.discordConfig;
	authConfig.state = req.session.state;
	const authURL = client.authorizeURL(authConfig);
	res.redirect(authURL);
}

export async function getDiscordReceiveToken(req, res) {
	if (req.query.state == req.session.state) {
		let authConfig = config.discordConfig;
		authConfig.state = req.session.state;
		try {
			const accessToken = await client.getToken(authConfig);
		} catch (error) {
			log.error(`Unable to get Token: ${error}`);
			res.render("main", {
				title: "Authorization error",
				content: `Unable to get access token:\n<br><pre>${error}</pre>`
			});
			return;
		}
		req.session.accessToken = accessToken;
		getter.defaults.headers.common["Authorization"] = "Bearer " + accessToken;
		let userDetails = await getter.get("/users/@me");
		req.session.isLoggedIn = true;
		req.session.discordUsername = userDetails.username + "#" + userDetails.discriminator;
		req.session.discordUser = userDetails;
		let userRecord = database.getByDiscordID(userDetails.id);
		if (!userRecord) userRecord = database.createNew();
		["id","username","discriminator","avatar","locale","flags","premium_type","public_flags","bot","system","mfa_enabled","verified"].forEach((property) => {
			userRecord.discordUser[property] = userDetails[property];
		});
		let userGuilds = await getter.get("/users/@me/guilds");
		userRecord.discordUser.guilds = userGuilds;
		database.update(userRecord);
		req.session.userRecord = userRecord;
		res.redirect("/mcUserRequest");
	} else {
		log.warn(`Got code with invalid state. Got ${req.query.state}, expected ${req.session.state}`);
		res.render("main", {
			title: "Authorization error",
			content: `Unable to verify token state`
		});
		return;
	}
}