//node JS server code
console.log("loading server")

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const User = require("./models/Users");
const Member = require("./models/Members");
const Group = require("./models/Groups")
const Event = require("./models/Events")
const Chat = require("./models/Chats")
const Channel = require("./models/Channels")

const path = require('path');
const bcrypt = require("bcrypt");
const cookieParser = require("cookie-parser");
const { createToken, validateToken } = require("./JWT")
const cloudinary = require("cloudinary").v2;
const formidable = require("formidable");
const uniqid = require("uniqid")

//DOUBLE CHECK CORS BEFORE RELEASE - MAY NOT BE SECURE
// const cors = require("cors");


require("dotenv").config();

app.use(express.json());
// app.use(cors({ credentials: true, origin: 'http://localhost:3000' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'build')));

//connection to server - password included, safe??

mongoose.connect("mongodb+srv://langroopsadmin:" + process.env.MONGODB_PASSWORD + "@cluster0.tovje.mongodb.net/langroopsDB")

console.log("arrived")

cloudinary.config({
    cloud_name: 'langroops',
    api_key: '775482527458556',
    api_secret: process.env.CLOUDINARY_SECRET
});


app.get("/", (req, res) => {
    console.log("ping?")
    // res.send("Hello World");
    res.sendFile(path.resolve(__dirname, 'build', 'index.html'));
  });

// --------------------- REGISTER PAGE SERVER ------------------------------

app.post("/register", (req, res) => {
    const accountInfo = {
        email: req.body.values.email,
        password: req.body.values.password
    }
    console.log(accountInfo.email)
    User.findOne({ email: accountInfo.email }, function (err, result) {
        if (result === null) {
            bcrypt.hash(accountInfo.password, 10).then((hash) => {
                const newUser = new User({
                    email: accountInfo.email,
                    password: hash,
                    created_date: new Date(),
                    updated_date: new Date(),
                    role: "account"
                })

                newUser.save().then(() => {
                    console.log("User Registered")
                    const accessToken = createToken(newUser);
                    console.log(accessToken);
                    res.cookie("access-token", accessToken, {
                        maxAge: 30 * 24 * 60 * 60
                    })
                    res.send({
                        token: "test123"
                    })
                })
                    .catch((err) => {
                        console.log(err)
                    })
            })
        }
        else {
            console.log("user exists")
            res.send("error: user exists")
        }
    }
    )

});


// ----------------------- LOGIN PAGE SERVER ------------------------------

//change to handle GET and POST differently

app.post("/login", async (req, res) => {
    const accountInfo = {
        email: req.body.values.email,
        password: req.body.values.password
    }
    console.log(accountInfo.email)
    const user = await User.findOne({ email: accountInfo.email })
    if (!user) {
        console.log("User doesn't exist")
    }
    else {
        const dbpassword = user.password;
        bcrypt.compare(accountInfo.password, dbpassword, function (err, result) {
            if (err) {
                console.log(err);// handle error
            }
            if (result) {
                const accessToken = createToken(user);
                console.log(accessToken);
                res.cookie("access-token", accessToken, {
                    maxAge: 30*24*60*60*100
                })

                res.send({
                    token: "test123"
                })
                // Send JWT
            } else {
                console.log()
                // response is OutgoingMessage object that server response http request
                console.log("Wrong Password")
            }
        });

    }
})


// --------------------- PROFILE PAGE SERVER ------------------------------

app.get("/profile", validateToken, (req, res) => {
    console.log(req.accessToken)
})

app.post("/profile", validateToken, async (req, res) => {
    // console.log(req.accessToken.id)
    const member = await Member.findOne({ owner: req.accessToken.id })
    .catch((err)=>{
        console.log(err)
    })
        if (member) {
            console.log("User already has member profile")
            res.send("User already has member profile")
        }
        else {
            const newMember = new Member({
                first_name: req.body.firstName,
                last_name: req.body.lastName,
                profile_pic: req.body.profilePic,
                native_language: req.body.nativeLanguage,
                fluent_languages: req.body.fluentLanguages,
                learning_languages: req.body.learningLanguages,
                joined_groups: [],
                admin_groups: [],
                group_chats: [], // group channels
                event_chats: [], // event channels
                private_chats: [], // private channels
                created_date: new Date(),
                owner: req.accessToken.id
            })
            newMember.save().then(() => {
                console.log("Member Registered")
                res.send("Member Registered")
                User.findOneAndUpdate({ _id: req.accessToken.id }, { role: "member" })
                    .then(() => {
                        console.log("User updated")
                    })
                    .catch((err) => {
                        console.log(err)
                    })
            })
                .catch((err) => {
                    console.log(err)
                })
            }
        })



app.post("/cropper", (req, res, next) => {
    console.log(req.body)
    const form = formidable({ multiples: true });

    form.parse(req, (err, fields, files) => {
        if (err) {
            next(err);
            return;
        }
        console.log(files.image.filepath)
        cloudinary.uploader.upload(files.image.filepath)
            .then((result) => {
                res.status(200).send({
                    message: "success",
                    result
                });
                console.log(result) //SAVE RESULT.URL
            }).catch((error) => {
                res.status(500).send({
                    message: "failure",
                    error,
                });
            });
    });
})

//------------------------------------------------------------------------------

app.post("/create-group", validateToken, (req, res) => {
    console.log(req.accessToken.id)
    console.log(req.body.groupName)
    Member.findOne({ owner: req.accessToken.id }, function (err, member) {
        // console.log(member)
        if (member) {

            const newGroup = new Group({
                group_name: req.body.groupName,
                group_type: req.body.groupType,
                group_URL: Math.floor(Math.random() * 100000000),
                group_pic: null,
                admin: member._id,
                members: [member._id],
                channel: "",
                created_date: new Date(),
                owner: req.accessToken.id
            })

            newGroup.save(function (err, group) {
                if (err) {
                    console.log(err)
                } else {
                    console.log("Group Created")
                    const newChannel = new Channel({
                        channel_type: "group", // "group", "event", "private"
                        channel_name: group.group_name,
                        group_id: group._id, //if group channel
                        event_id: null, //if event channel
                        read_by: [],
                        admin: member._id
                    })

                    newChannel.save(function (err, channel) {
                        if (err) {
                            console.log(err)
                        }
                        else {
                            Group.findOneAndUpdate({ _id: channel.group_id }, { channel: channel._id }, function (err, updatedGroup) {
                                if (err) {
                                    console.log(err)
                                } else {
                                    // console.log(updatedGroup)
                                    Member.findOneAndUpdate({ _id: member._id }, { $push: { admin_groups: group._id, group_chats: channel._id } }, function (err, updatedMember) {
                                        if (err) {
                                            console.log(err)
                                        } else {
                                            console.log(updatedGroup)
                                            res.send(updatedGroup)
                                        }
                                    })
                                }
                            })
                        }
                    })
                }
            })
        } else {
            console.log("No Member")
            res.send("error: no member profile")
        }
    }
    )

})

app.post("/book-event", validateToken, (req, res) => {
    console.log(req.accessToken.id)
    // console.log(req.body.groupName)
    Member.findOne({ owner: req.accessToken.id }, function (err, member) {
        // console.log(member)
        if (member) {

            const newEvent = new Event({
                event_name: req.body.eventName,
                event_URL: Math.floor(Math.random() * 100000000),
                event_start_date: req.body.eventStartDate,
                event_pic: null,
                admin: member._id,
                hosts: [member._id],
                attendees: [member._id],
                channel: null,
                created_date: new Date(),
                owner: req.accessToken.id
            })

            newEvent.save(function (err, event) {
                if (err) {
                    console.log(err)
                } else {
                    console.log("Event Created")
                    const newChannel = new Channel({
                        channel_type: "event", // "group", "event", "private"
                        channel_name: event.event_name,
                        group_id: null, //if group channel
                        event_id: event._id, //if event channel
                        read_by: [],
                        admin: member._id
                    })

                    newChannel.save(function (err, channel) {
                        if (err) {
                            console.log(err)
                        }
                        else {
                            Event.findOneAndUpdate({ _id: channel.event_id }, { channel: channel._id }, function (err, updatedEvent) {
                                if (err) {
                                    console.log(err)
                                } else {
                                    // console.log(updatedGroup)
                                    Member.findOneAndUpdate({ _id: member._id }, { $push: { admin_events: event._id, host_events: event._id, rsvp_events: event._id, event_chats: channel._id } }, function (err, updatedMember) {
                                        if (err) {
                                            console.log(err)
                                        } else {
                                            console.log(updatedEvent)
                                            res.send(updatedEvent)
                                        }
                                    })
                                }
                            })
                        }
                    })
                }
            })
        }
        else {
            console.log("No Member")
            res.send("error: no member profile")
        }
    }
    )

})


// --------------------- GROUP PAGES SERVER ------------------------------

app.get("/groups", (req, res) => {
    Group.find({}, function (err, result) {
        res.send(result)
    })
})

app.get("/group/:groupURL", (req, res) => {
    let groupURL = req.params.groupURL
    console.log(groupURL)
    Group.findOne({ group_URL: groupURL }, function (err, result) {
        res.send(result)
    })
})

app.get("/group/:groupURL/join-group", validateToken, (req, res) => {
    let groupURL = req.params.groupURL
    Member.findOne({ owner: req.accessToken.id }, function (err, member) {
        // console.log(result)
        if (member) {
            let memberId = member._id
            console.log(groupURL)
            Group.findOne({ group_URL: groupURL }, function (err, group) {
                if (group.members.includes(memberId)) {
                    console.log("Member already joined")
                }
                else {
                    Group.findOneAndUpdate({ group_URL: groupURL }, { $push: { members: memberId } }, function (err, group) {
                        Member.findByIdAndUpdate(memberId, {$push: {joined_groups: group._id, group_chats: group.channel}}, function (err, result) {
                            res.send("Member Added Successfully")
                        })
                    })
                }
            })

        }
        else {
            console.log("No such member")
        }
    })
})

app.get("/group/:groupURL/leave-group", validateToken, (req, res) => {
    let groupURL = req.params.groupURL
    Member.findOne({ owner: req.accessToken.id }, function (err, member) {
        // console.log(result)
        if (member) {
            let memberId = member._id
            console.log(groupURL)
            Group.findOne({ group_URL: groupURL }, function (err, group) {
                if (group.members.includes(memberId) && group.admin !== memberId) {
                    Group.findOneAndUpdate({ group_URL: groupURL }, { $pull: { members: memberId } }, function (err, result) {
                        Member.findByIdAndUpdate(memberId, { $pull: { joined_groups: group._id, group_chats: group.channel } }, function (err, result) {
                            res.send("Member Left Successfully")
                        })
                    })
                }
                else {
                    console.log("Member not part of group")
                }
            })

        }
        else {
            console.log("No such member")
        }
    })
})

// --------------------- EVENT PAGES SERVER ------------------------------

app.get("/events", (req, res) => {
    Event.find({}, function (err, result) {
        res.send(result)
    })
})


app.get("/event/:eventURL", (req, res) => {
    let eventURL = req.params.eventURL
    console.log(eventURL)
    Event.findOne({ event_URL: eventURL }, function (err, result) {
        res.send(result)
    })
})

app.get("/event/:eventURL/rsvp", validateToken, (req, res) => {
    let eventURL = req.params.eventURL
    Member.findOne({ owner: req.accessToken.id }, function (err, member) {
        // console.log(result)
        if (member) {
            let memberId = member._id
            // console.log(groupURL)
            Event.findOne({ event_URL: eventURL }, function (err, event) {
                if (event.attendees.includes(memberId)) {
                    console.log("Member already rsvpd")
                }
                else {
                    Event.findOneAndUpdate({ event_URL: eventURL }, { $push: { attendees: memberId } }, function (err, event) {
                        Member.findByIdAndUpdate(memberId, { rsvp_events: event._id, event_chats: event.channel }, function (err, result) {
                            res.send("Member rsvped Successfully")
                        })
                    })
                }
            })

        }
        else {
            console.log("No such member")
        }
    })
})

app.get("/event/:eventURL/cancel-rsvp", validateToken, (req, res) => {
    let eventURL = req.params.eventURL
    Member.findOne({ owner: req.accessToken.id }, function (err, member) {
        // console.log(result)
        if (member) {
            let memberId = member._id
            // console.log(groupURL)
            Event.findOne({ event_URL: eventURL }, function (err, event) {
                if (event.attendees.includes(memberId) && event.admin != memberId) {
                    Event.findOneAndUpdate({ event_URL: eventURL }, { $pull: { attendees: memberId, hosts: memberId } }, function (err, event) {
                        Member.findByIdAndUpdate(memberId, { $pull: { rsvp_events: event._id, host_events: event._id, event_chats: event.channel } }, function (err, updatedMember) {
                            res.send("Member canceled rsvp Successfully")
                        })
                    })
                }
                else {
                    console.log("Not rsvped or admin")
                }
            })

        }
        else {
            console.log("No such member")
        }
    })
})







app.post("/channels/members/fetch", (req, res) => {
    // console.log(req.body)
    const chatType = req.body.channel_type + "Chats";
    const channelId = req.body.channel_id;
    // console.log(chatType, channelId)
    var ObjectId = require('mongoose').Types.ObjectId;
    Member.find({ [chatType]: new ObjectId(channelId) }, function (err, members) {
        if (err) {
            console.log(err)
        } else {
            // console.log(members)
            res.send(members)
        }
    })
})


app.post("/groups/:groupURL/chat", validateToken, (req, res) => {
    console.log(req.body)
    let groupURL = req.params.groupURL

    Member.findOne({ owner: req.accessToken.id }, function (err, member) {
        if (member) {
            Group.findOne({ groupURL: groupURL }, function (err, group) {
                if (group.members.includes(member._id)) {
                    const newChat = new Chat({
                        channel_id: group.channel,
                        sender_id: member._id,
                        content: req.body.chatText,
                        image: req.body.chatImage,
                        audio: req.body.chatAudio,
                        status: null, //"deleted" , "edited"
                        created_date: new Date(),
                        updated_date: new Date()

                    })

                    newChat.save()
                    // Channel.findOneAndUpdate({ groupURL: groupURL }, { $push: { chat: newChat } }, function (err, result) {
                    //     res.send("Chat sent successfully")
                    // })
                }
                else {
                    console.log("user not group member")
                }
            })
        }
    })
})


app.post("/chats/post", validateToken, (req, res) => {
    Member.findOne({ owner: req.accessToken.id }, function (err, member) {
        if (member) {
            const newChat = new Chat({
                channel_id: req.body.channel,
                sender_id: member._id,
                content: req.body.chatText,
                image: req.body.chatImage,
                audio: req.body.chatAudio,
                status: null, //"deleted" , "edited"
                created_date: new Date(),
                updated_date: new Date()

            })

            newChat.save()
                .then(() => {
                    res.send("message sent")
                })
                .catch((err) => {
                    console.log(err)
                })
        }
    })
})


//get group members profile
app.post("/group/members/fetch", async (req, res) => {
    const members = req.body;
    console.log(members)
    // if (members) { //changed this code to suit members page will need recoding for channels page
        const filteredMembers = [];
        for (let i = 0; i < members.length; i++) {
            const filter = await Member.findOne({ _id: members[i] })
            filteredMembers.push(filter);
            // console.log(filteredMembers);
        }
        // console.log(filteredMembers)
        res.send(filteredMembers);
    // } else {
    //     console.log("no filter")
    //     Member.find({})
    //         .sort({ created_date: -1 })
    //         .limit(10)
    //         .exec(function (err, results) {
    //             res.send(results);
    //         })

    // }
})

//get event attendees profiles
app.post("/event/attendees/fetch", async (req, res) => {
    const attendees = req.body;
    console.log(attendees)
        const filteredMembers = [];
        for (let i = 0; i < attendees.length; i++) {
            const filter = await Member.findOne({ _id: attendees[i] })
            filteredMembers.push(filter);
            // console.log(filteredMembers);
        }
        // console.log(filteredMembers)
        res.send(filteredMembers);
})

//get a single members profile
app.get("/member/fetch", validateToken, async (req, res) => {
    Member.findOne({ owner: req.accessToken.id }, function (err, member) {
        res.send(member)
    })
})

app.post("/chats/fetch", (req, res) => {
    // console.log(req.body)
    const channelId = req.body.currentChannel;
    const filteredChats = [];
    // console.log(channelId)
    Chat.find({ channel_id: channelId }, function (err, chats) {
        if (err) {
            console.log(err)
        }
        else {
            // console.log(chats)
            res.send(chats)
        }
    })
})

app.post("/chat/delete", (req,res)=>{
    console.log(req.body.chatId)
    Chat.findByIdAndUpdate(req.body.chatId, {status: "deleted"})
    .then((result)=>{
        console.log("deleted")
    })
    .catch((err)=>{
        console.log(err)
    })
})

app.post("/channels/fetch", async (req, res) => {
    const channelIds = req.body.channelIds;
    const filteredChannels = [];
    console.log(channelIds)
    if (channelIds) {
        for (let i = 0; i < channelIds.length; i++) {
            console.log("loop")
            console.log(channelIds[i])
            const filter = await Channel.findById(channelIds[i])
            filteredChannels.push(filter)
        }
        res.send(filteredChannels)
    } else {
        console.log("no channels")
    }
})


//get all members with filter
//query = {
// filters: [{field:, value:, type:}, ...] //pass as exact object of filters
// (types: contains, eq, ne, gt, lt [])
//>>>types 
// limit: 
// sort: ascending, descending //pass as an exact sort
//}
app.post("/members/fetch", (req, res) => {
    console.log(req.body)
    const {filters, limit, sort} = req.body

    Member.find(filters)
        .limit(limit)
        .sort(sort)
        .exec(function (err, results) {
            if (err) {
                console.log(err)
            } else {
                res.send(results)
            }
        })
})

//get all events with filter
app.post("/events/fetch", (req, res) => {
    console.log("ping")
    const {filters, limit, sort} = req.body
    Event.find(filters)
        .limit(limit)
        .sort(sort)
        .exec(function (err, results) {
            if (err) {
                console.log(err)
            } else {
                res.send(results)
            }
        })
})


//get all groups with filter
app.post("/groups/fetch", (req, res) => {
    const { filters, limit, sort } = req.body
    Group.find(filters)
        .limit(limit)
        .sort(sort)
        .exec(function (err, results) {
            if (err) {
                console.log(err)
            } else {
                res.send(results)
            }
        })
})

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3001;
}
app.listen(port, function(err){
if(err){
    console.log(err)
}
else{
console.log("listening on port " + port)
}
})

const http = require('http');
const { Server } = require("socket.io");

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"]
    }
  });

// app.get('/', (req, res) => {
//   res.send("Hello World");
// });