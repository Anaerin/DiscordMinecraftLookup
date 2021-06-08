"use strict";
import winston from "winston";
import winstonDailyRotateFile from "winston-daily-rotate-file";

var logLevel = "warn";
if (isDebug) logLevel = "debug";
var log = new(winston.Logger)({
	transports: [
		new(winston.transports.Console)({
			colorize: true,
			json: false,
			timestamp: true,
			level: logLevel
		}),
		new(winston.transports.DailyRotateFile)({
			filename: "logs/debug.log",
			datePattern: "yyyy-MM-dd.",
			prepend: true,
			level: logLevel,
			json: false
		})
	]
});

module.exports = log;