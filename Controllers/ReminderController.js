const ReminderModel = require('../Models/ReminderModel')

const getAllRemindersController = (req, res) => {
    ReminderModel.find({}, (err, reminderList) => {
        if (err) {
            console.log(err)
            return res.json({
                status: "ERROR_OCCURED",
                message: err.message
            })
        }

        if (reminderList) {
            return res.json({
                status: "SUCCESSFULLY_FETCHED",
                message: reminderList,
            })
        }
    })
}

const addRemindersController = (req, res) => {
    const { reminderMsg, remindAt } = req.body

    const newReminder = new ReminderModel({
        reminderMessage: reminderMsg,
        remindAt,
        isReminded: false
    })

    newReminder.save(error => {
        if (error) {
            console.log(error)
            return res.json({
                status: "ERROR_SAVE",
                message: error.message
            })
        }
        Reminder.find({}, (err, reminderList) => {
            if (err) {
                console.log(err)
                return res.json({
                    status: "ERROR_OCCURED",
                    message: err.message
                })
            }
            if (reminderList) {
                return res.json({
                    status: "SUCCESSFULLY_FETCHED",
                    message: reminderList
                })
            }
        })
    })
}

const deleteRemindersController = (req, res) => {
    ReminderModel.deleteOne({
        _id: req.body.id
    },
        () => {
            ReminderModel.find({}, (err, reminderList) => {
                if (err) {
                    console.log(err)
                    return res.json({
                        status: "ERROR_OCCURED",
                        message: err.message
                    })
                }
                if (reminderList) {
                    return res.json({
                        status: "SUCCESSFULLY_FETCHED",
                        message: reminderList
                    })
                }
            })
        })
}

module.exports = { getAllRemindersController, addRemindersController, deleteRemindersController }