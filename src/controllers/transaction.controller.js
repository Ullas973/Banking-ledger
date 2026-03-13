const transactionModel = require("../models/transaction.model");
const ledgerModel = require("../models/ledger.model");
const emailService = require('../services/email.service')
const accountModel = require('../models/account.model')
const mongoose = require('mongoose')
/**
 * --create new transaction
 * --THE 10 STEPS OF TRANSFER FLOW
 * 1)validate request --all the inputs are in correct format huh?
 * 2)validate idempotency key --key correct idiya??
 * 3)check account status --whether the account is frozen or closed
 * 4)derive sender balance from ledger --check whether sender has sufficient balacne or not 
 * 5)create transaction (pending)
 * 6)create debit ledger entry
 * 7)create credit ledger entry
 * 8)mark transaction completed
 * 9)commit mongo DB session
 * 10) Send email notification
 */

async function createTransaction(req,res){
  /**
   * validate request
   */
  const { fromAccount, toAccount, amount, idempotencyKey } = req.body;
  if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
    //we usually send 400 status when there is mistake from client side that the required fields are not sent
    return res.status(400).json({
      message: "All the firlds from to amount and key all are necessary",
    });
  }

  const fromUserAccount = await accountModel.findOne({
    _id: fromAccount,
  });
  const toUserAccount = await accountModel.findOne({
    _id: toAccount,
  });
  if (!fromUserAccount || !toUserAccount) {
    return res.status(400).json({
      message: "Invalid fromAccount or toAccount",
    });
  }

  /**
   * validate idempotency key
   * --
   */
   const isTransactionAlreadyExists = await transactionModel.findOne({
    idempotencyKey:idempotencyKey
   })
   if(isTransactionAlreadyExists){
     if(isTransactionAlreadyExists.status == "COMPLETED"){
       return res.status(200).json({
            message:"Transaction already processed",
            
        })
     }
     if(isTransactionAlreadyExists.status == "PENDING"){
       return res.status(200).json({
            message:"Transaction still processing",
            
        })
     }
     if(isTransactionAlreadyExists.status == "FAILED"){
        return  res.status(500).json({
            message:"Transaction processing failed, please retry"
         })
     }
     if(isTransactionAlreadyExists.status == "REVERSED"){
       return  res.status(500).json({
           message:"Transaction was reversed, please retry" 
        })
     }
      
    }

    /**
     * check account status
     * we can only transer from one account to another only if both the accounts are active not frozen or deleted
     */
  if(fromUserAccount.status !="ACTIVE" || toUserAccount.status!="ACTIVE"){
     return res.status(500).json({
        message:"Both from account and to account should be active to make transaction"
     })
  }

    /**
     * derive the balance from sender's account
     */
    const balance = await fromUserAccount.getBalance()
    if(balance<amount){
       return res.status(400).json({
            message:`Insufficient balance, Current balnce is ${balance}, requested transfer is ${amount}`
        })
    }

    /**
     * create transaction here we create session for which we need mongoose package
     */
    let transaction;
    try{
    const session = await mongoose.startSession()
    await session.startTransaction()
     transaction = (await transactionModel.create([{
        fromAccount,
        toAccount,
        amount,
        idempotencyKey,
        status:"PENDING"
    }],{session}))[0]
    
  
    const debitLedgerEntry = await ledgerModel.create([
      {
        account: fromAccount,
        amount: amount,
        transaction: transaction._id,
        type: "DEBIT",
      }],
      { session },
    );
   
    // await(()=>{
    //     return new Promise((resolve)=> setTimeout(resolve, 15* 1000));
    // })()
   
    const creditLedgerEntry = await ledgerModel.create([{
        account: toAccount,
        amount:amount,
        transaction: transaction._id,
        type:"CREDIT"

    }],{session})

    await transactionModel.findOneAndUpdate(
      {_id:transaction._id},
      {status: "COMPLETED"},
      {session}
    )
 
    await session.commitTransaction()
    
    session.endSession}
    //so we have complete the transaction started with pending di dboth the ledgers and then changes the status to completed and then ended the session
    // the reason of putting it in the session is so that all the activities should happen at once should not halt at middle and save changes.
    catch(err){
       return res.status(400).json({
        message:"Transaction is pending, please wait for some time"
       })
    }

    /**
     * Send email notification
     */
    await emailService.sendTransactionEmail(req.user.email, req.user.name, amount, toAccount )
    return res.status(201).json({
       message:"Transaction completed successfully",
       transaction:transaction 
    })
}
async function createInitialFundsTransaction(req,res){
    const{toAccount, amount, idempotencyKey} = req.body;
    if (!toAccount || !amount || !idempotencyKey) {

    return res.status(400).json({
      message: "All the fields toAccount, amount and key all are necessary",
    });
   
}
 const toUserAccount = await accountModel.findOne({
        _id:toAccount
    })
    if(!toUserAccount){
        return res.status(400).json({
            message:"Invalid toAccount"
        })
    }
    //from user account will be the system account
    const fromUserAccount = await accountModel.findOne({
        // systemUser:true,
        user:req.user._id
    })
    //in case system account ne yaradru delete madbitre
    if(!fromUserAccount){
        return res.status(400).json({
            message:"System user account not found"
        })
    }
     const session = await mongoose.startSession()
     session.startTransaction()
     const transaction = new transactionModel({
        fromAccount:fromUserAccount._id,
        toAccount,
        amount,
        idempotencyKey,
        status:"PENDING"
     })

     const debitLedgerEntry = await ledgerModel.create([{
        account: fromUserAccount._id,
        amount: amount,
        transaction: transaction._id,
        type: "DEBIT"
    }], { session })

    const creditLedgerEntry = await ledgerModel.create([{
         account: toAccount,
         amount: amount,
         transaction: transaction._id,
         type: "CREDIT"
    }], { session })
    
    transaction.status="COMPLETED"
    await transaction.save({session})

    await session.commitTransaction()
    session.endSession()

    return res.status(201).json({
        message:"Inital funds transaction completed successful",
        transaction:transaction
    })


}  

module.exports = {
  createTransaction,
  createInitialFundsTransaction
};