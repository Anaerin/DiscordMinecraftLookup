import fs from "fs";
import log from "./log.js";

export default class db {
	#JSONFile = [];
	constructor() {
		let rawFile;
		try {
			rawFile = fs.readFileSync("users.json");
		} catch(error) {
			log.warn(`Error opening DB: ${error}`);
		}
		if (rawFile) this.#JSONFile = JSON.parse(rawFile);
	}
	getByID(id) {
		return this.hasRecords(this.#JSONFile.filter((elem) => {
			return elem?.id == id;
		}));
	}
	getByDiscordID(discordID) {
		return this.hasRecords(this.#JSONFile.filter((elem) => {
			return elem?.discordUser?.id == discordID
		}));
	}
	getByMinecraftID(minecraftID) {
		return this.hasRecords(this.#JSONFile.filter((elem) => {
			return elem?.minecraftUser?.id == minecraftID
		}));
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
				id: null,
				username: null,
				discriminator: null,
				avatar: null,
				bot: false,
				system: false,
				mfa_enabled: false,
				locale: null,
				verified: false,
				isInGuild: false
			},
			minecraftUser: {
				id: null,
				name: null
			}
		}
		this.#JSONFile.push(newRecord);
		return this.getByID(id);
	}
	hasRecords(ary) {
		if (ary.length > 0) return ary[0];
		return false;
	}
}