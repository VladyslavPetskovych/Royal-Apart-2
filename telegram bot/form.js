const axios = require("axios");
const bot = require("./bot");
const { notifyAdmins, escapeHtml } = require("./admin");
const roomMap = new Map();
const userStates = {};
const formButtons = {
  reply_markup: JSON.stringify({
    inline_keyboard: [
      [{ text: "Змінити дані", callback_data: "change form" }],
      [
        {
          text: "Додати коментар або побажання 📝",
          callback_data: "coment form",
        },
      ],
      [{ text: "Надіслати запит менеджеру", callback_data: "user data" }],
      [{ text: "🔙 Меню ●", callback_data: "back_to_menu" }],
    ],
  }),
};

const cooldowns = new Map();

const notifyAdminsAboutRequest = async (chatId) => {
  try {
    const { data: u } = await axios.get(`https://royalapart.online/api/users/${chatId}`);
    await notifyAdmins(
      `🔔 <b>Нова заявка на бронювання</b>\n\n` +
        `Квартира: ${escapeHtml(u.currentroom?.name || "-")}\n` +
        `Ціна: ${escapeHtml(u.currentroom?.price ?? "-")}\n` +
        `Дати: ${escapeHtml(u.chkin || "-")} → ${escapeHtml(u.chkout || "-")}\n` +
        `Ім'я: ${escapeHtml(u.name || "-")}\n` +
        `Телефон: ${escapeHtml(u.phone || "-")}\n` +
        `Коментар: ${escapeHtml(u.coment || "-")}\n` +
        `<a href="tg://user?id=${Number(chatId)}">Написати гостю</a>`
    );
  } catch (error) {
    console.error("[Admin] Failed to notify about request:", error.message);
  }
};

const resetUserState = (chatId) => {
  roomMap.delete(chatId); // Remove the user's data from roomMap
  delete userStates[chatId]; // If you're using a separate userStates object
  console.log(`User state reset for chatId: ${chatId}`);
};


const sendUserData = async (chatId) => {
  const userData = roomMap.get(chatId);

  // Check if phone number exists
  if (!userData || !userData.phone) {
    bot.sendMessage(
      chatId,
      "Будь ласка, надайте свій номер телефону перед надсиланням."
    );
    return;
  }

  const currentTime = Date.now();
  if (cooldowns.has(chatId)) {
    const lastSentTime = cooldowns.get(chatId);
    const timeDifference = currentTime - lastSentTime;
    const cooldownDuration = 60 * 1000; // 1 minute in milliseconds

    if (timeDifference < cooldownDuration) {
      const remainingTime = cooldownDuration - timeDifference;
      const remainingSeconds = Math.ceil(remainingTime / 1000);
      bot.sendMessage(
        chatId,
        `Будь ласка, зачекайте ${remainingSeconds} секунд перед повторним надсиланням.`
      );
      return; // Exit the function if still in cooldown
    }
  }

  // Send data if no cooldown and phone is provided
  console.log("!!!!!USER DATA IS SENT!!!!!");
  console.log(chatId);
  let data = {
    chatId: chatId,
  };
  await axios.post("https://royalapart.online/api/email/sendEmail", data);
  notifyAdminsAboutRequest(chatId);
  bot.sendMessage(
    chatId,
    "Ваші дані надіслані менеджеру, дякуємо за бронювання, очікуйте."
  );

  resetUserState(chatId);

  // Update cooldown timestamp
  cooldowns.set(chatId, currentTime);
};

const askForName = async (chatId) => {
  bot.sendMessage(chatId, `\nНапишіть Ваше ім'я: \t...✍️`);
  const message = await waitForUserInput(chatId);
  console.log(`User name: ${message.text}`);

  try {
    await axios.post("https://royalapart.online/api/users", {
      chatId: chatId,
      name: message.text,
    });
  } catch (error) {
    console.error("Error:", error.message);
  }

  return message.text;
};

const waitForUserInput = (chatId) => {
  return new Promise((resolve) => {
    userResolvers.set(chatId, resolve);

    const messageListener = (message) => {
      if (message.text.startsWith("/")) {
        return;
      }
      const resolver = userResolvers.get(message.chat.id);
      if (resolver) {
        resolver(message);
        userResolvers.delete(message.chat.id);

        bot.removeListener("message", messageListener);
      }
    };

    userListeners.set(chatId, messageListener);
    bot.on("message", messageListener);
  });
};

const askForPhone = async (chatId) => {
  bot.sendMessage(
    chatId,
    `Будь ласка, надішліть свій номер телефону, натиснувши кнопку нижче:`,
    {
      reply_markup: {
        keyboard: [
          [
            {
              text: "📲 Надіслати мій номер телефону",
              request_contact: true, // This allows the user to send their contact
            },
          ],
        ],
        one_time_keyboard: true, // The keyboard will disappear after use
        resize_keyboard: true, // Resize keyboard for better visibility
      },
    }
  );

  return new Promise((resolve) => {
    const contactListener = (msg) => {
      if (msg.contact && msg.chat.id === chatId) {
        const phoneNumber = msg.contact.phone_number;
        console.log(`Received phone number: ${phoneNumber}`);

        // Send phone number to server
        axios
          .post("https://royalapart.online/api/users", {
            chatId: chatId,
            phone: phoneNumber,
          })
          .then(() => {
            bot.sendMessage(
              chatId,
              `Ваш номер телефону ${phoneNumber} було успішно отримано.`
            );
            console.log(
              `Phone number ${phoneNumber} saved for chatId: ${chatId}`
            );
          })
          .catch((error) => {
            console.error("Error saving phone number:", error);
            bot.sendMessage(
              chatId,
              "Сталася помилка при збереженні вашого номеру телефону."
            );
          });

        resolve(phoneNumber);
        bot.removeListener("message", contactListener); // Remove listener after resolving
      }
    };

    bot.on("message", contactListener);
  });
};

const userResolvers = new Map();
const userListeners = new Map();

const form = async (receivedChatId) => {
  let userData = roomMap.get(receivedChatId) || {};

  // Ask for name if it's not provided
  if (!userData.name) {
    const userName = await askForName(receivedChatId);
    userData.name = userName;
    roomMap.set(receivedChatId, userData);
  }

  // Ask for phone if it's not provided
  if (!userData.phone) {
    const userPhone = await askForPhone(receivedChatId);
    userData.phone = userPhone;
    roomMap.set(receivedChatId, userData);
  }

  // Now both name and phone should be provided
  const response = await axios.get(
    `https://royalapart.online/api/users/${receivedChatId}`
  );
  let Userinf = response.data;

  let roomMessage;
  if (Userinf.context === "a") {
    roomMessage = `Ви обрали квартиру ${Userinf.currentroom.name}`;
  } else {
    roomMessage =
      Userinf.currentroom.price > 10000
        ? `Ви обрали квартиру ${Userinf.currentroom.name} - Договірна ціна`
        : `Ви обрали квартиру ${Userinf.currentroom.name} за ціною: ${Userinf.currentroom.price}грн`;
  }

  bot.sendMessage(
    receivedChatId,
    `${roomMessage}\n\n\n\tВаші дані: \nім'я: ${
      userData.name
    }\nномер телефону: ${userData.phone} \nКоментар: ${Userinf.coment || "-"}`,
    formButtons
  );
};

const askForComment = async (chatId) => {
  bot.sendMessage(chatId, `Будь ласка, залиште ваш коментар: \t...\t✍️`);
  const message = await waitForUserInput(chatId);
  try {
    await axios.post("https://royalapart.online/api/users", {
      chatId: chatId,
      coment: message.text,
    });
  } catch (error) {
    console.error("Error:", error.message);
  }
  const response = await axios.get(`https://royalapart.online/api/users/${chatId}`);
  let Userinf = response.data;

  let roomMessage;
  if (Userinf.context === "a") {
    roomMessage = `Ви обрали квартиру ${Userinf.currentroom.name}`;
  } else {
    roomMessage =
      Userinf.currentroom.price > 10000
        ? `Ви обрали квартиру ${Userinf.currentroom.name} - Договірна ціна`
        : `Ви обрали квартиру ${Userinf.currentroom.name} за ціною: ${Userinf.currentroom.price}грн`;
  }

  bot.sendMessage(
    chatId,
    `${roomMessage}\n\n\n\tВаші дані: \nім'я: ${Userinf.name}\nномер телефону: ${Userinf.phone} \nКоментар:  ${Userinf.coment}`,
    formButtons
  );
  return message.text;
};

bot.on("callback_query", async (query) => {
  const callbackData = query.data;

  if (callbackData === "user data") {
    console.log(
      "Sended data !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
    );
    sendUserData(query.message.chat.id);
  }

  if (callbackData === "change form") {
    await resetUserState(query.message.chat.id);
    await form(query.message.chat.id);
    askForComment(query.message.chat.id);
  }
  if (callbackData === "coment form") {
    askForComment(query.message.chat.id);
  }
});
module.exports = form;
