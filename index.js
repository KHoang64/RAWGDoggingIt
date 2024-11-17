require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const Game = require('./models/Game'); // Assuming you have a Game model in the models folder
const fs = require('fs');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

// Serve static files from the "public" directory
app.use(express.static('public'));

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log(err));

// Route to fetch games from RAWG API and save them to the database
app.get('/fetch-games', async (req, res) => {
  try {
    const response = await axios.get(
      `https://api.rawg.io/api/games?key=${process.env.RAWG_API_KEY}&page_size=10`
    );

    const games = response.data.results
      .filter((game) => game.released >= '2023-01-01' && game.released <= '2024-12-31')
      .map((game) => ({
        id: game.id,
        name: game.name,
        released: game.released,
        rating: game.rating,
        platforms: game.platforms.map((p) => p.platform.name),
      }));

    // Save to MongoDB
    await Game.insertMany(games, { ordered: false });

    // Save to JSON file
    fs.writeFileSync('./games-2023-2024.json', JSON.stringify(games, null, 2));

    res.send('Games from 2023 and 2024 fetched, stored in the database, and saved to ./games-2023-2024.json.');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching or saving games.');
  }
});

// Route to display games from the database in HTML
app.get('/', async (req, res) => {
  try {
    const games = await Game.find({
      released: { $gte: '2023-01-01', $lte: '2024-12-31' },
    });

    let gameList = games
      .map(
        (game) =>
          `<li><strong>${game.name}</strong> (Released: ${game.released}) - Rating: ${game.rating}</li>`
      )
      .join('');

    res.send(`
      <html>
        <head>
          <title>New Games in 2023-2024</title>
          <link rel="stylesheet" type="text/css" href="/style.css">
        </head>
        <body>
          <h1>New Games in 2023-2024</h1>
          <ul>${gameList}</ul>
        </body>
      </html>
    `);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error displaying games.');
  }
});

// Route to get games as JSON
app.get('/games', async (req, res) => {
  try {
    const games = await Game.find({
      released: { $gte: '2023-01-01', $lte: '2024-12-31' },
    });
    res.json(games);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error retrieving games.');
  }
});

// Start the server
app.listen(PORT, () => console.log(`Server is running on http://localhost:${PORT}`));
