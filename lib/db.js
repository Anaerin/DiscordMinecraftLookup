import fs from "fs";
import log from "./log.js";

export class db {
	#JSONFile = [];
	async constructor() {
		let rawFile = "";
		try { 
			rawFile = await fs.readFile("users.json");
			this.#JSONFile = JSON.parse(rawFile);
		} catch (error) {
			// Couldn't open. Doesn't exist?
		}
	}
	getByID(id) {
		return this.#JSONFile.filter((elem) => {
			return elem && elem.id && elem.id == id;
		});
	}
	getByDiscordID(discordID) {
		return this.#JSONFile.filter((elem) => {
			return elem && elem.discordUser && elem.discordUser.id && elem.discordUser.id == discordID
		});
	}
	getByMinecraftID(minecraftID) {
		return this.#JSONFile.filter((elem) => {
			return elem && elem.minecraftUser && elem.minecraftUser.id && elem.minecraftUser.id == minecraftID
		});
	}
	getNewID() {
		return this.#JSONFile.reduce((acc, currentValue) => {
			if (currentValue.id > acc) return currentValue.id;
			return acc;
		}, 0) + 1;
	}
	set(id, value, batch=false) {
		let index = this.#JSONFile.findIndex((elem) => {
			return elem.id == id;
		});
		this.#JSONFile[index] = value;
		if (!batch) this.save();
	}
	update(record, batch=false) {
		this.set(record.id, record, batch);
	}
	save() {
		let text = JSON.stringify(this.#JSONFile,null,"\t");
		try {
			fs.writeFileSync("users.json",text);
		} catch (error) {
			log.error(`Unable to write database: ${error}`);
		}
	}
	getPos(id) {
		return this.#JSONFile.reduce((acc, cur, idx) => {
			if (cur.id == id) return idx;
			return acc;
		});
	}
	delete(id) {
		this.#JSONFile.splice(this.getPos(id),1);
		this.save();
	}
	createNew() {
		let id = this.getNewID();
		let newRecord = {
			id: id,
			banned: false,
			whitelisted: false,
			discordUser: {
				id,
				username,
				discriminator,
				avatar,
				bot: false,
				system: false,
				mfa_enabled: false,
				locale,
				verified: false,
				guilds: []
			},
			minecraftUser: {
				id,
				name
			}
		}
		this.#JSONFile.push(newRecord);
		return this.getByID(id);
	}
}