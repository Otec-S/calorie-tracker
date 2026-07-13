module.exports = {
  apps: [
    {
      name: "calorie-api",
      cwd: __dirname,
      script: "server/dist/index.js",
      node_args: "--env-file=server/.env",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
