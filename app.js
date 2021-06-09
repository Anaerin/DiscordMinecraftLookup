"use strict";
import log from "./lib/log.js";
import web from "./web/index.js";
let listener = web.listen(8080, () => {
	log.info(`Server is listening on port ${listener.address().address}:${listener.address().port}`);
});