const express = require("express");
const { MongoClient } = require("mongodb");
// const path

const app = express();
const port = 3500;

const mongoURI = "mongodb://localhost:27017";
const client = new MongoClient(mongoURI);
const dbName = "LabPrac";
const collectionName = "Team10b";
let myCollection;

app.use(express.json());
app.use(express.urlencoded({ extended: true}));

client.connect().then(() => {
    const db = client.db(dbName);
    myCollection = db.collection(collectionName);
    console.log("MongoDB Connected successfully!");
}).catch(err => {
    console.log("MongoDB connection error: ", err);
});

const clientResponse = (msg) => {
    return `<h3>${msg}</h3><a href="/">Back</a>`;
}

const tableResponse = (objArray, tableTitle) => {
    let respStr = clientResponse(tableTitle);
    
    respStr += `<table>`
    
    // Header section.
    respStr += `<tr>`;
    for(var key in objArray[0]) {
        if(key === "_id")
            continue;
        respStr += `<th>${key}</th>`;
    }
    respStr += `</tr>`;

    for(var idx in objArray) {
        respStr += `<tr>`;

        for(var key in objArray[idx]) {
            if(key === "_id")
                continue;
            respStr += `<td>${objArray[idx][key]}</td>`;
        }

        respStr += `</tr>`;
    }
    
    respStr += `</table>`

    return respStr;
}

app.get("/", (req, res) => {
    res.sendFile(__dirname+"/index.html");
});

app.post("/submit-data", async (req, res) => {
    const { teamId, teamName, title, domain, funding } = req.body;

    const startupObj = {
        teamId: teamId,
        teamName: teamName,
        title: title,
        domain: domain,
        funding: Number(funding)
    };

    try {
        const response = myCollection.insertOne( startupObj );
        res.send(clientResponse("Insertion successful!"));
    } catch(err) {
        res.status(500).send(clientResponse("Insertion error: "+err));
    }
});

app.get("/get-all", async (req, res) => {
    try {
        const response = await myCollection.find().toArray();
        res.send(tableResponse(response, "All Start-Ups List"));
    } catch(err) {
        res.send(clientResponse("Fetch error: "+err));
    }

});

app.get("/conditioned-get", async (req, res) => {
    try{
        const response = await myCollection.find({funding: {$gt: 500000}}).toArray();
        res.send(tableResponse(response, "Start-Ups with Funding GT 5 Lakhs/-"));
    } catch (err) {
        res.send(clientResponse("Error in selective fetching: "+err));
    }
});

app.put("/update-funding", async (req, res) => {
    const { srchTeamId, newFunding } = req.body;
    
    try {
        const response = await myCollection.findOneAndUpdate(
            {teamId: srchTeamId},
            { $set: {funding: newFunding}}
        );
        if(response.matchedCount) {
            res.send(clientResponse(`${response.matchedCount} records updated!`));
        } else {
            res.send(clientResponse("No matching records found!"));
        }
    } catch(err) {
        res.send(clientResponse("Updation error: "+err));
    }
});

app.get("/delete-all", async (req, res) => {
    const response = await myCollection.deleteMany();
    if(response.deletedCount) {
        res.send(clientResponse(`${response.deletedCount} records deleted!`));
    } else {
        res.send(clientResponse("No records to delete!"));
    }
});

app.listen(port, ()=> {
    console.log(`Express listening on https://localhost:${port}`);
})