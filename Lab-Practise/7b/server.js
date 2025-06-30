const express = require('express')
const {MongoClient} = require('mongodb')
const path = require('path')
const status = require('statuses')

const uri = 'mongodb://localhost:27017'
const app = express()
app.use(express.json())
app.use(express.urlencoded({extended:true}))
async function start() {
    const client = await MongoClient.connect(uri);
    const db = await client.db('StudentDB');
    const collection = db.collection('students');
    console.log("Collection created successfullu")
    app.get("/",(req,res)=>{
        res.sendFile(path.join(__dirname,'index.html'));
    })
    app.post("/create",async(req,res)=>{
        const {id,status} = req.body;
        collection.insertOne({id:parseInt(id),status});
        res.send('<h2>Inserted successful');
    })
    app.get("/getAll",async(req,res)=>{
        const sA= await collection.find({}).toArray();
        let html=''
        sA.forEach(element => {
            html+=`${element.id}:${element.status}`;
        });
        res.send(html);
    })
    app.put("/update",async(req,res)=>{
        const id = parseInt(req.body.id);
        try{
            
            await collection.findOneAndUpdate({id},
                {$set:{status:'Completed'}});
                
                res.send({message:"<Status Completed Set"})
        } catch(err) {
            console.log(err);
      
        }
    })
    app.get('/delete-all', async (req, res) => {
        const response = await collection.deleteMany({id: {$lte: 4}});
        if(response.deletedCount) {
            res.send(`<h2>${response.deletedCount} entries deleted.</h2>`);
        } else {
            res.send({message: `No matching entry to delete.`})
        }
    })
    app.listen(3000,()=>{
        console.log(`server running at http://localhost:${3000}`);
    })
}

start()