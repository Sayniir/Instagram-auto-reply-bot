module.exports = {
  apps: [{
    name: "instagram-bot",
    script: "./index.js",
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: "200M"
  }]
};
