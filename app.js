const TelegramBot = require('node-telegram-bot-api');
const schedule = require('node-schedule');
const moment = require('moment-timezone');
const fs = require('fs');

// Load Telegram Bot Token from environment variable or replace it with your actual token
const token = process.env.TELEGRAM_BOT_TOKEN || '6761062765:AAFUxTZs-a9mP1fY3IO6vRxBnJXy7i9n8XI';

// Developer information
const developerInfo = `
Developer Information:
- Name: Muhammad Sajid
- Email: sajid@sitetechbd.com
- Telegram: @sajidrds
- Phone: +8801926251425
`;

// Initialize Telegram Bot
const bot = new TelegramBot(token, { polling: true });

// Load user data from the public folder
const userDataPath = './public/user.json';

let users = [];

try {
  const userData = fs.readFileSync(userDataPath, 'utf8');
  users = JSON.parse(userData);
  if (!Array.isArray(users)) {
    console.error('Invalid user data. Expected an array.');
    users = [];
  }
} catch (error) {
  console.error('Error reading user data:', error);
  users = [];
}

// Function to send a scheduled message
function sendScheduledMessage(chatId, message) {
  bot.sendMessage(chatId, message);
}

// Helper function to get the date for daily, weekly, monthly, or yearly schedules
function getScheduleDate(frequency) {
  const currentDate = moment().tz('Asia/Dhaka');

  switch (frequency) {
    case 'daily':
      return currentDate.format('YYYY-MM-DD HH:mm:ss');
    case 'weekly':
      return currentDate.day(7).format('YYYY-MM-DD HH:mm:ss');
    case 'monthly':
      return currentDate.date(28).format('YYYY-MM-DD HH:mm:ss');
    case 'yearly':
      return currentDate.month(11).date(31).format('YYYY-MM-DD HH:mm:ss');
    default:
      return null;
  }
}

// State variables to store user input during scheduling
const userStates = {};

// Handle incoming messages
bot.on('message', (msg) => {
  const chatId = msg.chat.id;

  // Check if the user is in the process of scheduling
  if (userStates[chatId]) {
    handleScheduling(chatId, msg.text);
  } else {
    handleCommands(chatId, msg.text);
  }
});

// Handle commands or messages
function handleCommands(chatId, text) {
  // Handle commands or messages as needed
  if (text === '/start') {
    bot.sendMessage(chatId, 'Welcome to the scheduler bot! Use /schedule to set up a notification schedule, /list to see your schedule list, /delete to delete a schedule, /modify to modify a schedule, or /info for developer information.');
  } else if (text === '/schedule') {
    bot.sendMessage(chatId, 'Please enter the task name:');
    userStates[chatId] = { step: 1, scheduleData: {} };
  } else if (text === '/list') {
    showUserScheduleList(chatId);
  } else if (text === '/delete') {
    promptUserToDelete(chatId);
  } else if (text === '/info') {
    bot.sendMessage(chatId, developerInfo);
  } else if (text === '/modify') {
    promptUserToModify(chatId);
  } else {
    bot.sendMessage(chatId, 'Unknown command. Use /start to get started.');
  }
}

// Show schedule list for the user
function showUserScheduleList(chatId) {
  const userSchedules = users.filter(user => user.chatId === chatId);

  if (userSchedules.length > 0) {
    let scheduleListMessage = 'Your Schedule List:\n';
    userSchedules.forEach(schedule => {
      const formattedScheduleTime = moment(schedule.scheduleTime).tz('Asia/Dhaka').format('YYYY-MM-DD HH:mm');
      scheduleListMessage += `Task: ${schedule.taskName}\n`;
      scheduleListMessage += `Frequency: ${schedule.frequency}\n`;
      scheduleListMessage += `Time: ${formattedScheduleTime}\n`;
      scheduleListMessage += `Message: ${schedule.message}\n\n`;
    });

    bot.sendMessage(chatId, scheduleListMessage);
  } else {
    bot.sendMessage(chatId, 'You have no schedules. Use /schedule to set up a new schedule.');
  }
}

// Prompt user to select a schedule to delete
function promptUserToDelete(chatId) {
  const userSchedules = users.filter(user => user.chatId === chatId);

  if (userSchedules.length > 0) {
    let deletePromptMessage = 'Select a schedule to delete:\n';
    userSchedules.forEach((schedule, index) => {
      deletePromptMessage += `${index + 1}. Task: ${schedule.taskName}, Frequency: ${schedule.frequency}, Time: ${moment(schedule.scheduleTime).tz('Asia/Dhaka').format('YYYY-MM-DD HH:mm')}\n`;
    });

    bot.sendMessage(chatId, deletePromptMessage);
    userStates[chatId] = { step: 6, scheduleData: userSchedules };
  } else {
    bot.sendMessage(chatId, 'You have no schedules to delete. Use /schedule to set up a new schedule.');
  }
}

// Prompt user to select a schedule to modify
function promptUserToModify(chatId) {
  const userSchedules = users.filter(user => user.chatId === chatId);

  if (userSchedules.length > 0) {
    let modifyPromptMessage = 'Select a schedule to modify:\n';
    userSchedules.forEach((schedule, index) => {
      modifyPromptMessage += `${index + 1}. Task: ${schedule.taskName}, Frequency: ${schedule.frequency}, Time: ${moment(schedule.scheduleTime).tz('Asia/Dhaka').format('YYYY-MM-DD HH:mm')}\n`;
    });

    bot.sendMessage(chatId, modifyPromptMessage);
    userStates[chatId] = { step: 7, scheduleData: userSchedules };
  } else {
    bot.sendMessage(chatId, 'You have no schedules to modify. Use /schedule to set up a new schedule.');
  }
}

// Handle scheduling steps
function handleScheduling(chatId, text) {
  const userState = userStates[chatId];

  switch (userState.step) {
    case 1:
      // Task Name
      userState.scheduleData.taskName = text;
      bot.sendMessage(chatId, 'Task name set. Now enter the notification date in YYYY-MM-DD format:');
      userState.step++;
      break;
    case 2:
      // Notification Date
      if (moment(text, 'YYYY-MM-DD', true).isValid()) {
        userState.scheduleData.date = text;
        bot.sendMessage(chatId, 'Notification date set. Now enter the notification time in HH:mm format:');
        userState.step++;
      } else {
        bot.sendMessage(chatId, 'Invalid date format. Please use YYYY-MM-DD format. Try again:');
      }
      break;
    case 3:
      // Notification Time
      if (moment(text, 'HH:mm', true).isValid()) {
        userState.scheduleData.time = text;
        bot.sendMessage(chatId, 'Notification time set. Now choose the frequency: daily, weekly, monthly, yearly, or once:');
        userState.step++;
      } else {
        bot.sendMessage(chatId, 'Invalid time format. Please use HH:mm format. Try again:');
      }
      break;
    case 4:
      // Frequency
      if (['daily', 'weekly', 'monthly', 'yearly', 'once'].includes(text.toLowerCase())) {
        userState.scheduleData.frequency = text.toLowerCase();
        if (text.toLowerCase() === 'once') {
          bot.sendMessage(chatId, 'Frequency set. Now enter the date and time for the one-time notification in YYYY-MM-DD HH:mm format:');
          userState.step++;
        } else {
          bot.sendMessage(chatId, 'Frequency set. Now enter your message:');
          userState.step++;
        }
      } else {
        bot.sendMessage(chatId, 'Invalid frequency. Supported frequencies: daily, weekly, monthly, yearly, once. Try again:');
      }
      break;
    case 5:
      // Message
      userState.scheduleData.message = text;
      // Schedule messages using the user's specified date and time in Bangladesh timezone
      const scheduleDateTime = moment.tz(`${userState.scheduleData.date} ${userState.scheduleData.time}`, 'Asia/Dhaka').format();
      schedule.scheduleJob(scheduleDateTime, function () {
        const currentTime = moment().tz('Asia/Dhaka').format('YYYY-MM-DD HH:mm:ss');
        console.log(`Sending scheduled message to ${chatId} at ${currentTime}`);
        sendScheduledMessage(chatId, `Task: ${userState.scheduleData.taskName}\nMessage: ${userState.scheduleData.message}`);
      });

      // Update the users array and save it back to the user.json file
      users.push({
        chatId: chatId,
        taskName: userState.scheduleData.taskName,
        scheduleTime: scheduleDateTime,
        frequency: userState.scheduleData.frequency,
        message: userState.scheduleData.message
      });
      fs.writeFileSync(userDataPath, JSON.stringify(users, null, 2));

      bot.sendMessage(chatId, `Schedule set successfully! You will receive the message "${userState.scheduleData.message}" for task "${userState.scheduleData.taskName}" every ${userState.scheduleData.frequency} at ${userState.scheduleData.time} on ${userState.scheduleData.date} (Bangladesh time).`);

      // Reset user state
      delete userStates[chatId];
      break;
    case 6:
      // Delete selected schedule
      const scheduleIndex = parseInt(text) - 1;

      if (!isNaN(scheduleIndex) && scheduleIndex >= 0 && scheduleIndex < userState.scheduleData.length) {
        const scheduleToDelete = userState.scheduleData[scheduleIndex];
        const scheduleIndexInUsers = users.findIndex(user => user.chatId === chatId && user.scheduleTime === scheduleToDelete.scheduleTime);

        if (scheduleIndexInUsers !== -1) {
          // Cancel the scheduled job
          const scheduledJob = schedule.scheduledJobs[scheduleToDelete.scheduleTime];
          if (scheduledJob) {
            scheduledJob.cancel();
          }

          // Remove the schedule from users array and save it back to the user.json file
          users.splice(scheduleIndexInUsers, 1);
          fs.writeFileSync(userDataPath, JSON.stringify(users, null, 2));

          bot.sendMessage(chatId, `Schedule for Task "${scheduleToDelete.taskName}" has been deleted.`);
        } else {
          bot.sendMessage(chatId, 'Schedule not found.');
        }
      } else {
        bot.sendMessage(chatId, 'Invalid selection. Try again:');
      }

      // Reset user state
      delete userStates[chatId];
      break;
    case 7:
      // Modify selected schedule
      const modifyIndex = parseInt(text) - 1;

      if (!isNaN(modifyIndex) && modifyIndex >= 0 && modifyIndex < userState.scheduleData.length) {
        const scheduleToModify = userState.scheduleData[modifyIndex];
        const scheduleIndexInUsers = users.findIndex(user => user.chatId === chatId && user.scheduleTime === scheduleToModify.scheduleTime);

        if (scheduleIndexInUsers !== -1) {
          // Cancel the scheduled job
          const scheduledJob = schedule.scheduledJobs[scheduleToModify.scheduleTime];
          if (scheduledJob) {
            scheduledJob.cancel();
          }

          // Remove the schedule from users array temporarily
          const removedSchedule = users.splice(scheduleIndexInUsers, 1)[0];
          fs.writeFileSync(userDataPath, JSON.stringify(users, null, 2));

          // Prompt user to enter new scheduling details
          bot.sendMessage(chatId, `Modifying Schedule for Task "${scheduleToModify.taskName}"`);

          // Set up scheduling process with existing details pre-filled
          userStates[chatId] = { step: 1, scheduleData: { ...removedSchedule } };
        } else {
          bot.sendMessage(chatId, 'Schedule not found.');
        }
      } else {
        bot.sendMessage(chatId, 'Invalid selection. Try again:');
      }
      break;
    default:
      // Invalid state
      bot.sendMessage(chatId, 'Invalid state. Please use /schedule to start the scheduling process, /list to see your schedule list, /delete to delete a schedule, /modify to modify a schedule, or /info for developer information.');
      delete userStates[chatId];
  }
}
