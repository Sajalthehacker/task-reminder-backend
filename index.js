const express = require('express')
const app = express()
const dotenv = require('dotenv')
dotenv.config()
const cors = require('cors')
const PORT = process.env.PORT || 5000
const UserRoutes = require('./Routes/UserRoutes')
const ReminderRoutes = require('./Routes/ReminderRoutes')
const connectDB = require('./Config/db')
const ReminderModel = require('./Models/ReminderModel')
const nodemailer = require('nodemailer')

const mailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.AUTH_EMAIL,
        pass: process.env.AUTH_PASSWORD
    }
});

app.use(cors())
app.use(express.json())
app.use('/api/user', UserRoutes);
app.use('/api/reminder', ReminderRoutes)
connectDB()

app.use(express.urlencoded({ extended: true }))

setInterval(async () => {
    try {
        const reminderList = await ReminderModel.find({});

        if (reminderList) {
            for (const reminder of reminderList) {
                if (!reminder.isReminded) {
                    const now = new Date();
                    if (new Date(reminder.remindAt) - now < 0) {
                        await ReminderModel.findByIdAndUpdate(reminder._id, { isReminded: true });

                        const mailMessage = reminder.reminderMessage;
                        const mailOptions = {
                            from: process.env.AUTH_EMAIL,
                            to: email,
                            subject: "⏰⏰⏰ [Team DatesInfomer] You Have A Pending Task",
                            html: `<p>This Email Is Concerned To remind You about the task ${mailMessage} please do it carefully thank you<p><br/> <p>Regards [TEAM DatesInfomer] </p>`
                        };

                        await mailTransporter.sendMail(mailOptions);
                        console.log('reminder sent successfully on email');
                    }
                }
            }
        }
    } catch (err) {
        console.log(err);
    }
}, 1000);


app.listen(PORT, () => {
    console.log(`server is running on port http://localhost:${PORT}`)
});