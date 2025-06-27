// ecosystem.config.js
module.exports = {
    apps: [
      {
        name: "web-server",
        script: "server.js",
        env: {
          PORT: 3000
        }
      },
      {
        name: "api-server",
        script: "app.js",
        env: {
          PORT: 4000
        }
      }
    ]
  }
  