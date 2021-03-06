var express = require('express');
var router = express.Router();
var path = require("path");
var alert = require('alert');


var firebase = require('firebase');
const { fstat } = require('fs');
const { QuerySnapshot } = require('@google-cloud/firestore');
//const { firestore } = require('firebase-admin');


require("firebase/auth");
//require("@google-cloud/firestore")
require("firebase/database");
require("firebase/firestore");

const db = firebase.firestore();

const userDB = db.collection('users');
var specialaction = [];
var NameIPLoclist = [];
var i = 0;

function insertvalue(user_type, user_timeStamp, user_lecture, user_name, user_value) {

    var spcial = {
        type: user_type,
        timeStamp: user_timeStamp,
        lecture: user_lecture,
        username: user_name,
        value: user_value,
    }
    return spcial;
}

function insertlist(user_name, user_IP) {

    var userlist = {
        username: user_name,
        userIP: user_IP
    }
    return userlist;
}

function main() {
    var timeStamp = +new Date();
    specialaction.push(insertvalue("ex) text", timeStamp, "ex) 자료와구조", "ex) 홍길동", "ex) 1번 답이뭐야?"))
    NameIPLoclist.push(insertlist("홍길동", "IP"))

}

router.post('/specialface', function(req, res) {

    var timeStamp = +new Date();
    specialaction.push(insertvalue(req.body.type, timeStamp, req.body.lecture, req.body.name, req.body.facenum))
        // console.log(specialaction[i]);
    i++;

    res.end();
})
router.post('/specialtext', function(req, res) {
    var timeStamp = +new Date();
    specialaction.push(insertvalue(req.body.type, timeStamp, req.body.lecture, req.body.name, req.body.speechtext))
        //console.log(specialaction[i]);
    i++;

    /*console.log("req.body.lecture : ", req.body.lecture);
    console.log("req.body.name : ", req.body.name);
    console.log("req.body.speechtext : ", req.body.speechtext);
    console.log("req.body.type : ", req.body.type);*/
    res.end();
})

router.post('/IpLocate', function(req, res) {
    console.log("IPlocate");
    userNames = req.body.name;
    userIP = req.body.userIP;

    NameIPLoclist.push(insertlist(req.body.name, req.body.userIP));
    console.log("학생이 보낸거: ", NameIPLoclist);
})

main();

router.post('/createRoom', function(req, res) {
    let roomName = req.body.roomName;
    let professor = req.body.professor;

    db.collection('lecture').doc(roomName).set({
            id: roomName,
            time: (+new Date()),
            professor: professor,
        })
        .then(() => {
            console.log("추가성공");
        })
        .catch((error) => {
            console.log("에러발생");
            console.log(error)
        })

    res.end();

    res.end();
})
router.post('/removeIP', function(req, res) {

    for (var i = NameIPLoclist.length; i > 0; i--) {
        NameIPLoclist.pop();
    }

    res.end();
})



async function receiveScore(roomName, userNames) {
    var timeStamp = +new Date();
    timeStamp = timeStamp - 5000;
    var returnDict = {};

    var temp = 0;

    for (const item of userNames) {

        var docs = await db.collection('lecture').doc(roomName)
            .collection('studentName').doc(item)
            .collection('scoreData').where('time', '>', timeStamp).get().then((snapshot) => {
                temp = 0;

                snapshot.docs.forEach(doc => {
                    // console.log(doc.data());
                    if (!(item in returnDict)) {
                        returnDict[item] = []
                    }
                    temp = temp + parseInt(doc.data().score);
                })

                returnDict[item] = temp / snapshot.docs.length;;
            });
    }

    // console.log("return Dict : ", returnDict);
    return returnDict;
}

async function receiveAction() {
    var j = 0;
    var specialactionlist = [];
    var timeStamp2 = +new Date();
    timeStamp2 = timeStamp2 - 5000;
    for (j = 0; j <= i; j++) {
        if (specialaction[j].timeStamp >= timeStamp2) {
            specialactionlist.push(specialaction[j]);
        }

    }
    return specialactionlist;
}


router.post('/receiveAction', function(req, res) {
    userNames = req.body.name;
    lecture = req.body.lecture;
    receiveAction().then((dict) => {
        res.json(dict);

    });

})

router.post('/receiveData', function(req, res) {
    userNames = req.body.name;
    lecture = req.body.lecture;

    //console.log("hi");
    // console.log(userNames);
    // console.log(lecture);

    receiveScore(lecture, userNames).then((dict) => {

        res.json(dict);
    });

})

function sleep(ms) {
    const wakeUpTime = Date.now() + ms
    while (Date.now() < wakeUpTime) {}
  }

router.post('/receivelist', function(req, res) {
    console.log("Receive List");
    userNames = req.body.name;

    console.log(req.body.name);
    sleep(500);

    console.log("감독이 받는거: ", NameIPLoclist);

    res.json(NameIPLoclist);
})

router.post('/', function(req, res) {
    console.log(req.body);
    var HostName = req.body.name;
    var HostJob = req.body.job;
    req.session = null; //reset session variable

    var userInfo = { name: HostName, job: HostJob };
    var StudentName = new Array();
    var StudentEmail = new Array();

    let Viewer = userDB.where("job", "==", "student").get()
        .then(function(snap) {
            snap.forEach(function(doc) {
                StudentName.push(doc.data().name);
                StudentEmail.push(doc.data().email);
            })
            var studentInfo = { name: StudentName, email: StudentEmail };
            res.render('host', { userInfo: userInfo, studentInfo: studentInfo, error: false });
        })
        .catch(function(error) {
            console.log("Error : ", error);
        })
})
module.exports = router;