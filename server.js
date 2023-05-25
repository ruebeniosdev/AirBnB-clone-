const express = require('express')
require('colors')
const mongoose = require('mongoose')
require('dotenv').config()
//const helmet = require('helmet')
const connectDB = require('./config/db');
//const cors = require('cors')
const app = express()
const port = 8080

connectDB()

//app.use(cors())
//app.use(helmet())
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

app.use('/api/v1/create/', require('./routes/bookedRoute'))
app.use('/api/properties', require('./routes/propertyRoute'))
app.use('/api/properties/bookproperty/users', require('./routes/bookedRoute'))//get all booked property
app.use('/api/properties/bookproperty', require('./routes/bookedRoute'))// post , get ,update delete = property
app.use('/api/reservation', require('./routes/reservationRoute'))
app.use('/api/auth', require('./routes/authRoute')) // login , register, = user


app.listen(port, () => {
    console.log(`server runing ${port} `);
})