"use strict";
import winston from "winston";
import winstonDailyRotateFile from "winston-daily-rotate-file";

let logLevel = "warn";
let log = winston.createLogger({
	transports: [
		new winston.transports.Console({
			colorize: true,
			json: false,
			timestamp: true,
			level: logLevel,
			format: winston.format.combine(
				winston.format.splat(),
				winston.format.colorize(),
				winston.format.simple()
			)
		}),
		new winston.transports.DailyRotateFile({
			filename: "logs/debug.log",
			datePattern: "yyyy-MM-dd.",
			prepend: true,
			level: logLevel,
			json: false
		})
	]
});

export default log;