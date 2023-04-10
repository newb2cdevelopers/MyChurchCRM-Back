const nodemailer = require("nodemailer");
var fs = require("fs");
const path = require("path");

// email sender function
export const sendEmail = (email, asunto, html) => {
  return new Promise((resolve, reject) => {

    console.log(process.env.USER_MAIL, process.env.PASS_MAIL)
    // Definimos el transporter
    const transporter = nodemailer.createTransport({
      pool: true,
      host: "smtp.gmail.com",
      port: 465,
      secure: true, // use TLS
      auth: {
        user: process.env.USER_MAIL,
        pass: process.env.PASS_MAIL,
      },
      // Comentar para PROD
      // tls: {
      //   rejectUnauthorized: false,
      // },
    });

    // Definimos el email
    const mailOptions = {
      from: '"no-reply" ' + process.env.USER_MAIL,
      to: email,
      bcc: 'newb2cdevelopers@gmail.com',
      subject: asunto,
      //text: "Hello world?", // plain text body
      html: html, // html body
    };

    // Enviamos el email
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
        reject(false);
      } else {
        resolve(true);
        //console.log("Email sent: ", info);
      }
    });
  });
};