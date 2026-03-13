const mongoose = require('mongoose');

const ledgerSchema = new mongoose.Schema({
    account:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"account",
        required:[true, "Ledger must be associated with an account"],
        index:true,
        immutable:true //once a ledger is created it should not be modified or deleted
    },
    amount:{
        type:Number,
        required:[true,"Amount is required for creating a ledger entry"],
        immutable:true
    },
    transaction:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"transaction",
        required:[true, "Ledger must be associated with a transaction"],
        index:true,
        immutable:true
    },
    type:{
       type:String,
       enum:{
        values:["CREDIT","DEBIT"],
        message:"Type can be either CREDIT or DEBIT",
       },
       required:[true,"Ledger type is required"],
       immutable:true
    }

})

function preventLedgerModification(){
    throw new Error("Ledger entries are immuatble and cannot be modified or deleted");
}

//so whenevr the user tries to make change to ledger by using any of these operations he/she should not be able to make preventledgermodifcation function should be called and an error should be thrown.

ledgerSchema.pre('findOneAndUpdate', preventLedgerModification);
ledgerSchema.pre("updateOne", preventLedgerModification);
ledgerSchema.pre("deleteOne", preventLedgerModification);
ledgerSchema.pre("remove", preventLedgerModification);
ledgerSchema.pre("deleteMany", preventLedgerModification);
ledgerSchema.pre("findOneAndDelete", preventLedgerModification);
ledgerSchema.pre("findOneAndReplace", preventLedgerModification);


const ledgerModel = mongoose.model('ledger', ledgerSchema);

module.exports = ledgerModel;