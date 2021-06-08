"use strict";
import web from "web/index.js";
import log from "lib/log.js";
web.listen(8080, () => {
	log.info(`Server is listening on port ${web.address().address}:${web.address().port}`);
});