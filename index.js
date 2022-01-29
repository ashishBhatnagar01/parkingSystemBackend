require('dotenv').config();
const express=require('express');
const app=express();
const mongoose=require('mongoose')
const cors=require('cors')
const moment = require('moment')
const RazorPay=require('razorpay')
app.use(express.json())
app.use(cors());

//IMPORT MODELS
const entryModel=require('./models/entry')

var mongodb=process.env.MONGO_URI;
mongoose.connect (mongodb,{ useNewUrlParser: true, useUnifiedTopology: true }).then(()=>console.log("CONNECTION ESTABLISHED"));

function range(start, end) {
    return Array(end - start + 1).fill().map((_, idx) => start + idx)
  }

 const getBookedSlots=async()=>{
      let slotArr=[]
      let slots=await entryModel.find({isParked:true})
      for(let i=0;i<slots.length;i++){
          slotArr.push(slots[i].slot)
      }
      console.log("slotarr",slotArr)
      return slotArr;

  }

  var availableSlots
  var bookedSlots;
  var temp;
  var flag=false;
  var charge


app.get("/",async(req,res)=>{
    bookedSlots=await getBookedSlots()
    console.log("BookedSlots1",bookedSlots)
    return res.json({bookedSlots:bookedSlots})
})
app.post("/entry",async(req,res)=>{

    console.log(req.body)
    const {name,mail,contactNo,vehicleNo,category,remarks}=req.body
    const entryTime=moment().format('MMMM Do YYYY, h:mm:ss a');
    const entryTimeValue=moment()
    let isParked=true;
    let slot;
    bookedSlots=await getBookedSlots()
    console.log("BookedSlots3",bookedSlots.length)
    if(bookedSlots.length==0){
        bookedSlots.push(1)
        slot=1
        console.log("TEMP",temp)
    }
    else{
        console.log("TEMP",temp)
        let max=Math.max(...bookedSlots)
        availableSlots=range(max+1,60)
        if(!flag){
            slot=Math.min(...availableSlots)
        }
        else{
            slot=Math.min(...temp)
            temp=temp.filter(item=>item!=slot)
        }
        // bookedSlots.push(slot)
        // bookedSlots.sort(function(a,b){return a-b}); 
        availableSlots = availableSlots.filter(item => item !== slot)
        console.log("AvailSlot",availableSlots)
        console.log("BookedSlot",bookedSlots)
    }
    const newEntry=await entryModel.create({name,mail,contactNo,vehicleNo,category,remarks,entryTime,isParked,slot,entryTimeValue})
    console.log("newEntry",newEntry)
    
    return res.json({
        "entry":entryTime,
        slot:slot
    })
})

//Exit Parking

app.post('/exit',async(req,res)=>{
    // console.log(req.body)
    bookedSlots=await getBookedSlots()
    let max=Math.max(...bookedSlots)
    availableSlots=range(max+1,60)
    const exitTime=moment().format('MMMM Do YYYY, h:mm:ss a');
    const exitTimeValue= moment()
    const {vehicleNo}=req.body
    const updateExitTime=await entryModel.findOneAndUpdate({vehicleNo:vehicleNo,isParked:true},{exitTime:exitTime,isParked:false,exitTimeValue:exitTimeValue},{new:true})
    if(updateExitTime){
    console.log("Updatetd",updateExitTime)
    let allotedSlot=updateExitTime.slot;
    availableSlots.push(allotedSlot)
    console.log("After pushing the slot")
    availableSlots.sort(function(a,b){return a-b})
    console.log("RemSlots",availableSlots)
    temp=availableSlots
    flag=true
    //Money Calculation
    let entry=updateExitTime.entryTimeValue;
    let duration=moment.duration(exitTimeValue.diff(entry))
    console.log("--------------------------------------------")
    console.log(duration.asMinutes())
    if(duration.asMinutes()>0 && duration.asMinutes()<=60){
        charge=40
    }
    else if(duration.asMinutes()>60 && duration.asMinutes()<360){
        charge=80
    }
    else if(duration.asMinutes()>60 && duration.asMinutes()<720){
        charge=150
    }
    else{
        charge=400
    }

    bookedSlots = bookedSlots.filter(item => item !== allotedSlot)
    return res.json({availSlots:availableSlots,slot:allotedSlot,charge:charge,notFound:false,entryTime:updateExitTime.entryTime,exitTime:updateExitTime.exitTime,duration:duration.asMinutes().toFixed(2)})
}
else{
    return res.json({notFound:true,message:"Vehicle not found in the parking"})
}
})

app.post("/slot",async(req,res)=>{
    const {id}=req.body;
    const data=await entryModel.find({slot:id,isParked:true});
    console.log(data)
    return res.json({
        parkerDetails:data
    })
})

app.post("/payOnline",async(req,res)=>{
    let instance=new RazorPay({
        key_id:process.env.KEY_ID,
        key_secret:process.env.KEY_SECRET
    })
    
    instance.orders.create({amount:parseInt(req.body.charge)*100,currency:"INR"},
        (err,order)=>{
            if(!err){
                res.json(order)
            }
            else{
                res.json(err)
            }
        }
        )
})

app.listen(process.env.PORT || 4000,()=>{
    console.log("Express App is Running")
})