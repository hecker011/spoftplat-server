require("dotenv").config();
const express = require("express");
const app = express();

const port = process.env.PORT || 3000;

const server = app.listen(port, console.log(`Server listening on port ${port}`));

const io = require("socket.io")(server, {
    cors: {
        origin: "*"
    }
})

const Datastore = require('nedb')
    , db = new Datastore({ filename: 'data/database.json', autoload: true });

const fs = require("fs");

app.use(express.static("client"));

io.on("connection", (socket) => {
    console.log("Socket connected with id " + socket.id);

    socket.on("disconnect", (reason) => {
        console.log("Socket with id " + socket.id + " disconnected because " + reason);
    })

    socket.on("register", (username, cb) => {
        if (username.trim() == "" || username.length > 20) {
            cb({ ok: false });
            return;
        }

        db.find({ username }, (err, docs) => {
            if (err) {
                console.error(err);
                cb({ ok: false });
            } else {

                if (docs.length == 0) {
                    db.insert({ username, pb: Infinity }, (err, doc) => {
                        if (err) {
                            console.error(err);
                            cb({ ok: false });
                        } else {
                            cb({ ok: true });
                        }
                    })
                } else {
                    cb({ ok: false });
                }
            }
        })
    })

    socket.on("loadleaderboard", (plrdata, cb) => {
        db.update({ username: plrdata.username }, { username: plrdata.username, pb: plrdata.pb }, {}, (err, numReplaces) => {
            if (err) {
                console.error(err);
                cb({ ok: false, list: [] });
                return;
            }
            if (numReplaces == 1) {
                cb({ ok: true, list: db.getAllData().sort(function(a, b){
                    if(Number(a.pb) < Number(b.pb)) { return -1; }
                    if(Number(a.pb) > Number(b.pb)) { return 1; }
                    return 0;
                }) });
            }
        })
    })

    socket.on("checkUsername", (username, cb) => {
        db.find({ username }, (err, docs) => {
            if (err) {
                console.error(err);
                cb({ exists: true });
                return
            }
            if (docs.length == 1) {
                cb({ exists: true });
            } else {
                cb({ exists: false });
            }
        })
    })

})