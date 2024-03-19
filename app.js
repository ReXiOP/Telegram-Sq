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
  const userSchedules = users.filter(user =>
