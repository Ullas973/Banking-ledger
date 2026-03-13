require("dotenv").config(); //bcs we are getting the parameters from env file
const nodemailer = require("nodemailer"); //got the package installed

//google ka alag server hai which will send gmails..SMTP server
//So google makes use of numerous SMTP servers to handle mails so we use transporter to communicate with these smtp servers
//so to contact with SMTP server we need the following 4 params
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    type: "OAuth2",
    user: process.env.EMAIL_USER,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN,
  },
});

// Verify the connection configuration to verify whether the params given above are correct or not
//basically what happens is we have automate a mail from one of our gmail or the companys gmail to other mails so our server contacts with the SMTP server by using transporter which requires client id client secret refresh token and the mail id to communicate with smtp server and asks the SMTP server to send teh mail from so and so to so and so.....
transporter.verify((error, success) => {
  if (error) {
    console.error("Error connecting to email server:", error);
  } else {
    console.log("Email server is ready to send messages");
  }
});

// Function to send email
const sendEmail = async (to, subject, text, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"Backend ledger" <${process.env.EMAIL_USER}>`, // sender address
      to, // list of receivers
      subject, // Subject line
      text, // plain text body
      html, // html body
    });

    console.log('Message sent: %s', info.messageId);
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

//above code was all obtained from the github repo now whatever i am writing is according to the need
async function sendRegistrationEmail(userEmail, name){
const subject = 'Welcome to Backend Ledger!';
const text = `Hello ${name}, \n \n Thank you for registring at Backend Ledger, We are excited to have you on board! \n \n Best regards, \n Ullas and team`;
const html = `<p>Hello ${name},</p><p>Thank you for registering at Backend Ledger. We're excited to have you on board!</p><p>Best regards, <br>Ullas and team</p>`;
await sendEmail(userEmail,subject,text,html)
}

//the registration mail k liye yek function create kiya which has text subject html and userEmail and then we will exporting this from here 

//creating a new function to notify after the trnsaction is complete.that is successful transaction 

async function sendTransactionEmail(userEmail,name,amount,toAccount){
 const subject = "Transaction Complete";
 const text = `Hello ${name}, \n \n Your transaction of ${amount} to account ${toAccount} was successful. \n \n Best regards, \n Ullas and team`;
 const html = `<p>Hello ${name},</p><p>Your transaction of ${amount} to account ${toAccount} was successful.</p><p>Best regards, <br>Ullas and team</p>`;
 await sendEmail(userEmail, subject, text, html);
}

//Now what if the transaction failed in between for that another function as below.
async function sendTransactionFailureEmail(userEmail, name, amount, toAccount) {
  const subject = "Transaction Failed";
  const text = `Hello ${name}, \n \n We regret to inform you that the transaction of ${amount} to account ${toAccount} was a failure. \n \n Best regards, \n Ullas and team`;
  const html = `<p>Hello ${name},</p><p> We regret to inform you that the transaction of ${amount} to account ${toAccount} was a failure.</p><p>Best regards, <br>Ullas and team</p>`;
  await sendEmail(userEmail, subject, text, html);
}


module.exports = {
    sendRegistrationEmail,
    sendTransactionEmail,
    sendTransactionFailureEmail
}
