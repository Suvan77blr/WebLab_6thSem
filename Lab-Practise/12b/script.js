const express = require('express');
const { MongoClient } = require('mongodb');

const app = express();
const port = 3500;
const mongoURI = `mongodb://127.0.0.1:27017`;
const client = new MongoClient(mongoURI);
const dbName = "LabPrac";
const myCollectionName = "Stu12b";

const HtmlResponse = (respObj) => {
    let respString = `<table>`;
    respString += `<tr><th>ID</th><th>Name</th><th>Subject</th><th>Marks</th><th>Eligibility</th></tr>`;

    for(var idx in respObj ) {
        respString += "<tr>";

        for(var key in respObj[idx]) {
            if(key === "_id")
                continue;
            console.log(key+"\n");
            respString += `<td>${respObj[idx][key]}</td>`;
        }

        respString += "</tr>";
    }
    respString += "</table>";

    return respString;
}

app.use(express.json());
app.use(express.urlencoded({ extended: true}));
app.use(express.static(__dirname));

let myCollection;

client.connect().then(() => {
    const db = client.db(dbName);
    myCollection = db.collection(myCollectionName);
    console.log('Connected to MongoDB!');
}).catch(err => {
    console.log(`MongoDB Connection error: `, err);    
});

// Serving the HTML form.
app.get("/", (req, res) => {
    res.sendFile(__dirname+"/index.html");
})

app.post("/submit-data", async (req, res) => {
    const {stuID, stuName, subject, marks } = req.body;
    const studentObj = {
        stuId: stuID,
        stuName: stuName,
        subject: subject,
        marks: parseInt(marks),
        eligibility: ""
    };

    if (!stuID || !stuName || !subject || isNaN(marks)) {
       return res.status(400).send('Invalid input data.');
}

    studentObj["eligibility"] = (studentObj["marks"] < 20) ? "Not Eligible" : "Eligible";

    try {
        await myCollection.insertOne(studentObj);
        res.send('<h3>Student Data inserted to MongoDb successfully.</h3><a href="/">Back</a>');
    } catch(err) {
        res.status(500).send('Error in insertion of data.');
    }
});

app.get("/fetch-all", async (req, res) => {
    try {
        const result = await myCollection.find({}).toArray();
        console.log(result);
        console.log(typeof result);
        
        if(result.length){
            let respString = '<h3>All students fetched.</h3><a href="/">Back</a>';
            respString += HtmlResponse(result);
            res.send(respString);
        }
        else {
            res.send(`<h3>No entries in the Db</h3><a href='/'>Back</a>`);
        }
    } catch(err) {
        res.status(500).send('Error in retrival of data.');
    }
})

app.get("/hide-ne", async (req, res) => {
    try {
        const response = await myCollection.find({"eligibility": "Eligible"}).toArray();
        console.log(response);
        if(response.length) {
            let respString = `<h3>Hidden NE List..`;
            respString += HtmlResponse(response);
            respString += `<br><a href='/'>Back</a>`;
            res.send(respString);
        } else {
            res.send(`<h3>No entries in the Db.</h3><a href='/'>Back</a>`);
        }
        
    } catch (err) {
        res.status(500).send(`Error in hiding NE stduents: ${err}`);
    }
});

app.get("/delete-ne", async (req, res) => {
    // res.send(`<h3>Route under development..!</h3><a href="/">Back</a>`);
    const response = await myCollection.deleteMany({eligibility: "Not Eligible"});
    if(response.deletedCount > 0)
        res.send(`<h3>Deleted NE Students</h3><p>${response.deletedCount} entries removed.</p><a href='/'>Back</a>`);
    else
        res.send(`<h3>No more NE Students</h3><a href='/'>Back</a>`);

})

app.get("/delete-all", async (req, res) => {
    // res.send("<h3>Route under development..!</h3><a href='/'>Back</a>")
    const response = await myCollection.deleteMany();
    if(response.deletedCount)
        res.send(`<h3>All entries deleted</h3><p>${response.deletedCount} entries removed.</p><a href='/'>Back</a>`);
    else 
        res.send(`<h3>No entries to delete</h3><a href='/'>Back</a>`);
})

app.listen(port, ()=> {
    console.log(`Express listening on port ${port}`);
})