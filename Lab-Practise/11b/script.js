const express = require('express');
const { MongoClient } = require('mongodb');

const app = express();
const port = 3500;
const mongoURI = "mongodb://127.0.0.1:27017";
const dbName = "LabPrac";
const myCollectionName = "Stu11b";

app.use(express.json());
app.use(express.urlencoded({ extended: true}));
app.use(express.static(__dirname+"/index.html"));

const client = new MongoClient(mongoURI);
let myCollection;
client.connect().then( ()=> {
    console.log(`Connected to MongoDB!`);
    const db = client.db(dbName);
    myCollection = db.collection(myCollectionName);
}).catch(err => {
    console.log(`Failed to connect to MongoDB: `, err);
});

const clientResponse = (msg) => {
    return `<h3>${msg}</h3><a href='/'>Back</a>`;
};

const tableResponse = (objArray, tableTitle) => {
    // console.log(objArray);
    let respString = clientResponse(tableTitle);

    respString += `<table>`;
    respString += `<caption>${tableTitle}</caption>`;

    // Header section;
    respString += `<tr>`;
    for(var key in objArray[0]) {
        if(key === '_id' || key == 'totalAttendance') {
            continue;
        }
        respString += `<th>${key}</th>`;
    }
    respString += `</tr>`;

    // Body section;
    for(var idx in objArray) {
        respString += `<tr>`;

        for(var key in objArray[idx]) {
            if(key === "_id" || key === "totalAttendance") {
                continue;
            }
            respString += `<td>${objArray[idx][key]}</td>`;
        }

        respString += `</tr>`;
    }

    respString += `</table>`;
    return respString;
}

app.get("/", (req, res) => {
    res.sendFile(__dirname+"/index.html");
})

app.get("/show-all", async (req, res) => {
    try {

        const response = await myCollection.find().toArray();
        
        if(response.length) {
            res.send(tableResponse(response, "All Data"));
        } else {
            res.send(clientResponse("No data in Db!"));
        }
    } catch (err) {
        res.status(500).send(clientResponse("Error in fetching data: "+err));
    }
})

app.post("/submit-data", async (req, res) => {
    const { stuId, stuName, course, totalAttendance, studentAttendance } = req.body;

    const attendancePercentage = (parseFloat(studentAttendance) * 100) /parseFloat(totalAttendance);

    const studentObj = {
        stuId: stuId,
        stuName: stuName,
        course: course,
        attendancePercentage: Number(attendancePercentage.toFixed(2)),
        totalAttendance: parseInt(totalAttendance)
    }

    try {
        const response = await myCollection.insertOne(studentObj);
        console.log(response);
        res.send(clientResponse("Insertion successful!"));
    } catch(err) {
        res.send(clientResponse("Insertion error: "+err));
    }
});

app.get("/show-shortage", async (req, res) => {
    try {
        const response = await myCollection.find({attendancePercentage: {$lt: 75.0}}).toArray();

        if(response.length) {
            res.send(tableResponse(response, "Attendance Shortage List"));
        }
        else {
            res.send(clientResponse("No current students have attendance shortage"));
        }
    } catch(err) {
        res.status(500).send(clientResponse("Error in fetching the data: "+err));
    }
});

app.get("/delete-all", async (req, res) => {
    try {
        const response = await myCollection.deleteMany();
        if(response.deletedCount) {
            res.send(clientResponse(`${response.deletedCount} records deleted.`));
        }
        else {
            res.send(clientResponse("No records to delete"));
        }
    } catch(err) {
        res.status(500).send(clientResponse("Error occuring while deleting."+err));
    }
});

app.put("/update-attendance", async (req, res) => {
    const {stuId, newAttendance} = req.body;

    try {
        // const student = await myCollection.find({stuId}).toArray();
        const student = await myCollection.findOne({ stuId });

        if(!student) {
            res.send(clientResponse("Student not found"));
        }

        console.log(student);
        
        const stuTotalAttendance = student["totalAttendance"];

        if (!stuTotalAttendance || stuTotalAttendance === 0) {
            res.send(clientResponse("Total attendence is 0 or NaN"));
        }

        const attendancePercentage = Number(
            (parseFloat(newAttendance) * 100 / stuTotalAttendance).toFixed(2)
        );

        const updation = await myCollection.updateOne(
            {stuId}, 
            {$set : {attendancePercentage: attendancePercentage}}
        );

        // res.send({message: "Updation Successful!"});
        // const response = await myCollection.updateOne({stuId}, {$set: {att}})
        res.send(clientResponse("Update successful!"));
    } catch (err) {
        console.log(err);
        res.status(500).send("ID not found: "+err);
    }
});

app.listen(port, (req, res) => {
    console.log(`Express listening at https://localhost:${port}`);
})