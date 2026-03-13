const accountModel = require("../models/account.model");

async function createAccountController(req, res) {
    const user = req.user;
    const account = await accountModel.create({
        user:user._id
    })
    res.status(201).json({
        account
    })
}
//this is to fetch all the users who have account in the bank.
async function getUserAccountController(req,res){
 const accounts = await accountModel.find({user:req.user._id})
 res.status(200).json({
    accounts
 })
}

//this function to check the balance amount in the account
async function getAccountBalanceController(req,res){
   const {accountId} = req.params;

   //we should check here whether the user who is trying to fetch the balance uska hi account hai ki nahi
   const account = await accountModel.findOne({
    _id: accountId,
    user:req.user._id
   })
   if(!account){
      return res.status(404).json({
        message: "Account not found"
      })
   }
    
   const balance = await account.getBalance();
   res.status(200).json({
    accountId:account._id,
    balance:balance
   })
}


module.exports = {
  createAccountController,
  getUserAccountController,
  getAccountBalanceController,
};