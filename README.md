# DayTask MERN

A MERN habit tracker for weekday routines, daily checkoffs, streaks, login/logout accounts, and a month calendar that shows habit completion status.

## Stack

- MongoDB + Mongoose
- Express + Node.js
- React + Vite
- CSS-only responsive interface

## Features

- Build a separate habit plan for each weekday
- Copy one weekday plan into another weekday
- Check off daily tasks for any date
- Track the current streak of fully completed days
- See a monthly calendar with cross, yellow tick, and green tick status markers
- Register, login, and logout with a per-user dashboard

## Setup

1. Install dependencies from the project root:

   ```bash
   npm install
   ```

2. Create `server/.env` from the example file if you want to override the default local MongoDB settings.

3. Run both apps:

   ```bash
   npm run dev
   ```

The client runs on Vite and the API runs on port `5000` by default.
