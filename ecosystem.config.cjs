module.exports = {
  apps: [
    {
      name: "researchbot-api",
      cwd: "/Users/hyeonseok/Projects/ResearchBot",
      script: ".venv/bin/python",
      args: "-m uvicorn src.api.__main__:app --host 0.0.0.0 --port 8000",
      env: {
        PYTHONPATH: "/Users/hyeonseok/Projects/ResearchBot",
      },
      watch: false,
      autorestart: true,
      max_restarts: 10,
    },
    {
      name: "researchbot-web",
      cwd: "/Users/hyeonseok/Projects/ResearchBot/web",
      script: "npm",
      args: "start",
      watch: false,
      autorestart: true,
      max_restarts: 10,
    },
  ],
};
