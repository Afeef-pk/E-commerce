const env = require('dotenv').config();
const mongoose = require("mongoose")
mongoose.set('strictQuery',false)
mongoose.connect(process.env.MONGODB_IP).then(() => {
    console.log('database connected');
  }).catch((err) => {
    console.log(err);
  })
  
const express = require("express")
const app = express()

const path = require('path')
const userRoute = require("./routes/userRoute")
const adminRoute = require("./routes/adminRoute")
const session = require("express-session")
const nocache = require("nocache")
app.set('view engine', 'ejs')
app.use(nocache());
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(session(
    {
        secret: "mysitesessionsecert",
        resave: false,
        saveUninitialized: true,
    }))

app.use(express.static(path.join(__dirname, 'public')))

app.use('/admin',adminRoute)

app.use('/',userRoute)

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('error', { message: err.message });
  });

app.listen(process.env.PORT, ()=>{
console.log("server is running");
})