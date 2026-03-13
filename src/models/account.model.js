const mongoose = require('mongoose')
const ledgerModel = require('../models/ledger.model')
const accountSchema = new mongoose.Schema({
    user:{
         type: mongoose.Schema.Types.ObjectId,
         ref:"user",
         required:[true,"Account must be associated with the user"],
         index: true
    },
    status:{
        type:String,
        enum:{
            values: ["ACTIVE","FROZEN","CLOSED"],
            message: "Status can be either Active/Frozen/Clozed",
          
        },
        default:"ACTIVE"
    },
    currency:{
        type:String,
        required:[true,"Currency is required for creating an account"],
        default:"INR" 
    }

    
},{
    timestamps:true
})
accountSchema.index({user:1, status:1})

//here we are writing a function required to know the balance of the user
accountSchema.methods.getBalance =async function(){
//we need single source of truth for this which we will egt from ledgers so require the ledger model and then what we will be doing is first we will add all the debits that have happened with all the credits that have happened and then subtract to get the balance.

          const balanceData = await ledgerModel.aggregate([
            { $match: { account: new mongoose.Types.ObjectId(this._id) } },
            //here we are making use of aggregate which is one of the useful functionality of mongo db which can be used to run custom query
            {
              $group: {
                _id: null, //grouping onthe bais of null
                totalDebit: {
                  $sum: {
                    $cond: [
                      { $eq: ["$type", "DEBIT"] },
                      "$amount", //if type is debit we will add
                      0, //or else we will be adding 0 if it is credit
                    ],
                  },
                },
                totalCredit: {
                  $sum: {
                    $cond: [
                      { $eq: ["$type", "CREDIT"] },
                      "$amount", //if type is debit we will add
                      0, //or else we will be adding 0 if it is credit
                    ],
                  },
                },
              },
            },
            {
              $project: {
                _id: 0,
                balance: { $subtract: ["$totalCredit", "$totalDebit"] },
              },
            },
          ]);
          if(balanceData.length==0){
            return 0
          }
          return balanceData[0].balance
}

const accountModel = mongoose.model("account",accountSchema)

module.exports = accountModel;