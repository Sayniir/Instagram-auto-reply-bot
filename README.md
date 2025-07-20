
# 🤖 Instagram Auto-Reply Bot

A Node.js bot that automatically replies to Instagram comments and direct messages (DMs) based on keyword detection. This tool simplifies community management by providing quick, automated responses while helping you engage efficiently with your audience.

## 📋 Table of Contents

- 🚀 Features
- ⚙️ Technologies
- 📦 Installation
- 🔧 Configuration
- ▶️ Usage
- 💡 Best Practices
- 🙌 Credits
- ⚠️ Disclaimer
- 🚀 Future Enhancements

## 🚀 Features

- **Automated Replies:** Automatically responds to comments and direct messages (DMs) based on configured keywords.
- **Customizable Responses:** Replies are fully configurable via a simple `config.json` file.
- **Detailed Logs:** Console displays sent messages, recipients, and other useful debug information.
- **Self-Message Detection:** Prevents infinite loops by ignoring the bot’s own messages.
- **Production-Ready:** PM2 support for reliable process management.

## ⚙️ Technologies

- **Node.js**
- **[instagram-private-api](https://github.com/dilame/instagram-private-api)**
- **PM2 (Process Manager)**

## 📦 Installation

1. **Clone the repository:**

```bash
git clone https://github.com/your-username/instagram-auto-reply-bot.git
cd instagram-auto-reply-bot
````

2. **Install dependencies:**

```bash
npm install
npm install instagram-private-api
npm install pm2 -g
```

3. **Set up environment variables:**

Create a `.env` file at the root of your project and add your Instagram credentials:

```bash
IG_USERNAME=your_instagram_username
IG_PASSWORD=your_instagram_password
```

4. **Create configuration file:**

Create a `config.json` file in the project root to define your keyword-based responses:

```json
{
  "motsClesCommentaires": {
    "keywoard_1": "Response 1",
    "keywoard_2": "Response 2"
  },
  "motsClesDM": {
    "keywoard_dm_1": "Reply 1",
    "keywoard_dm_2": "Reply 2"
  }
}
```

## ▶️ Usage

**For development:**

```bash
node index.js
```

**For production (using PM2):**

```bash
pm2 start index.js --name instagram-bot
pm2 logs instagram-bot
```

The bot will:

* Log in to Instagram.
* Listen for comments and DMs in real-time.
* Reply automatically based on your `config.json`.
* Display detailed logs in your terminal or via PM2.

## 💡 Best Practices

* **Avoid Spam:** Use responsibly and avoid sending unsolicited messages.
* **Respect Instagram Rate Limits:** To reduce the risk of bans, consider adding delays between replies.
* **Customize Responses:** Personalize your replies to avoid appearing robotic.
* **Use PM2 in Production:** Ensures the bot stays online, auto-restarts on failure, and manages logs efficiently.

## 🙌 Credits

This project uses the excellent [dilame/instagram-private-api](https://github.com/dilame/instagram-private-api). Special thanks to its contributors.

## ⚠️ Disclaimer

This project is intended for **educational and personal use only**. Use at your own risk. Misusing Instagram’s private API can result in account suspensions or bans. The project creator assumes **no responsibility** for misuse.

## 🚀 Future Enhancements

* File-based log system (instead of console-only).
* Web dashboard for easier configuration.
* Multi-account management.
* Live keyword update system.
* Optional plugin system for extending features.

**Enjoy automating your Instagram! 🚀**

