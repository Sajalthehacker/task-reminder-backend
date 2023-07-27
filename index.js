const express = require('express')
const app = express()
const dotenv = require('dotenv')
dotenv.config()
const cors = require('cors')
const PORT = process.env.PORT || 5000
const UserRoutes = require('./Routes/UserRoutes')
const connectDB = require('./Config/db')

app.use(cors())
app.use(express.json())
app.use('/api/user', UserRoutes);
connectDB()
app.set('view engine', 'ejs')
app.use(express.urlencoded({ extended: true }))


app.listen(PORT, () => {
    console.log(`server is running on port http://localhost:${PORT}`)
});