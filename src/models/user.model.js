const mongoose = require('mongoose');
const bcrypt  = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required for creatinga user"],
      trim: true, //no spaces required
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email address"], //whatever the format of mail the user is giving is correct or not to chaeck that
      unique: [true, "Email already exists"],
    },
    name: {
      type: String,
      required: [true, "Name is required for creating an account"],
    },
    password: {
      type: String,
      required: [true, "Password is required for creating account"],
      minlength: [6, "Password should be minimum of 6 characters"],
      select: false //for any user query if we do we wont get the password in default bcs the password should be pvt it should not be fetched whenever we are querying
    },
    systemUser:{
        type:Boolean,
        default:false,
        immutable:true,
        select:false
        
    }
  },
  {
    timestamps: true, // whenever the user was created and any updation was made it will be recorded aswe have mentioned timestamp
  },
);
//if the user password is changed then it needs to be hashed bcs we dont store user data in plain data format.
userSchema.pre("save",async function(){
  if(!this.isModified("password")){
    return 
  }
  const hash = await bcrypt.hash(this.password, 10)
  this.password = hash;
  return 
})
userSchema.methods.comparePassword = async function(password){
    return await bcrypt.compare(password, this.password ) // this password is what is already stored in database
} // here it checks whether both the password match or not!

const userModel = mongoose.model("user", userSchema)
module.exports = userModel;