"use strict";
import web from "web/index.js";
web.listen(8080, () => {
	console.log(`Server is listening on port ${web.port}`);
});