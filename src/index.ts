import { createApp } from './api/server.js';

const app = createApp();
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`University Timetable Management System running on http://localhost:${PORT}`);
});
