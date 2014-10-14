var express = require('express'),
    app = express();

app.use("/", express.static("./src"));
app.use("/test/", express.static("./test"));

app.listen("8080");
