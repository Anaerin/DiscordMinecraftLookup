import { ClientCredentials, AuthorizationCode } from "simple-oauth2";
import web from "./index.js";
import log from "../lib/log.js";
import axios from "axios";
import db from "../lib/db.js";

const getter = axios.create({
	baseURL: "https://discord.com/api",

})

function randomCharacters(len) {
	Array.apply(0, Array(len)).map(() => {
		return (function(charset) {
			return charset.charAt(Math.floor(Math.random() * charset.length))
		}("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"));
	}).join("");
}

const oAuthConfig = {
	client: {
		id: "852723928782733322",
		secret: "DvTjJ_ncUrt-rrV2ckFcqxYJg5KKEgvJ"
	},
	auth: {
		tokenHost: "discord.com",
		tokenPath: "/api/oauth2/token",
		revokePath: "/api/oauth2/token/revoke",
		authorizePath: "/api/oauth2/authorize"
	}
}

const AuthConfig = {
	redirect_uri: "https://minecraft.awoo.ga/code",
	scope: [
		"identify",
		"guilds"
	]
}

const client = new AuthorizationCode(oAuthConfig);

const database = new db();

export function oAuth(req, res) {
	req.session.state = randomCharacters(25);
	let authConfig = AuthConfig;
	authConfig.state = req.session.state;
	const authURL = client.authorizeURL(authConfig);
	res.redirect(authURL);
}

export async function code(req, res) {
	if (req.query.state == req.session.state) {
		let authConfig = AuthConfig;
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
		for (property of userDetails) {
			if (["id","username","discriminator","avatar","locale","flags","premium_type","public_flags"].includes(property)) {
				userRecord.discordUser[property] = userDetails[property];
			}
			if (["bot","system","mfa_enabled","verified"].includes(property)) {
				userRecord.discordUser[property] = !!userDetails[property];
			}
		}
		let userGuilds = await getter.get("/users/@me/guilds");
		userRecord.discordUser.guilds = userGuilds;
		database.update(userRecord);
		req.session.userRecord = userRecord;
		res.redirect("/mcUserRequest");
	} else {
		log.warn(`Got code with invalid state. Got ${req.query.state}, expected ${req.session.state}`);
	}
}