const ReminderModel = require('../Models/ReminderModel');

const getAllRemindersController = async (req, res) => {
    try {
        const reminderList = await ReminderModel.find({});

        if (!reminderList || reminderList.length === 0) {
            return res.json({
                status: "NO_REMINDERS",
                message: "No reminders found"
            });
        }

        return res.json({
            status: "SUCCESSFULLY_FETCHED",
            message: reminderList
        });

    } catch (err) {
        console.log(err);
        return res.json({
            status: "ERROR_OCCURED",
            message: err.message
        });
    }
};

const addRemindersController = async (req, res) => {
    const { reminderMsg, remindAt } = req.body;

    if (!req.body.reminderMsg || !req.body.remindAt) {
        return res.json({
            status: "INVALID_REQUEST",
            message: "Please provide reminder message and remind at time"
        });
    }

    const newReminder = new ReminderModel({
        reminderMessage: reminderMsg,
        remindAt,
        isReminded: false
    });

    try {
        await newReminder.save();

        const reminderList = await ReminderModel.find({});

        return res.json({
            status: "SUCCESSFULLY_FETCHED",
            message: reminderList
        });

    } 
    catch (error) {
        console.log(error);
        return res.json({
            status: "ERROR_SAVE",
            message: error.message
        });
    }
};

const deleteRemindersController = async (req, res) => {
    if (!req.body.id) {
        return res.json({
            status: "INVALID_REQUEST",
            message: "Please provide reminder id"
        });
    }

    try {
        await ReminderModel.deleteOne({ _id: req.body.id });

        const reminderList = await ReminderModel.find({});

        return res.json({
            status: "SUCCESSFULLY_FETCHED",
            message: reminderList
        });
    } catch (err) {
        console.log(err);
        return res.json({
            status: "ERROR_OCCURED",
            message: err.message
        });
    }
};

module.exports = { getAllRemindersController, addRemindersController, deleteRemindersController };
