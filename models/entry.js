const mongoose=require('mongoose')

const EntrySchema= new mongoose.Schema({
    name:{
        type:String
    },
    mail:{
        type:String
    },
    contactNo:{
        type:Number
    },
    vehicleNo:{
        type:String
    },
    category:{
        type:String
    },
    remarks:{
        type:String
    },
    entryTime:{
        type:String
    },
    slot:{
        type:Number
    },
    isParked:{
        type:Boolean
    },
    exitTime:{
        type:String
    },
    entryTimeValue:{
        type:String
    },
    exitTimeValue:{
        type:String
    }
})

const EntryModel=mongoose.model("entries",EntrySchema)

module.exports=EntryModel;