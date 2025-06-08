const express = require('express');
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const cron = require('node-cron');
const path = require('path');

const prisma = new PrismaClient();
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

const API_BASE = 'https://www.thesportsdb.com/api/v1/json/3';

async function fetchLeagues(country) {
  const res = await axios.get(`${API_BASE}/search_all_leagues.php`, { params: { c: country } });
  return res.data.countrys || [];
}

async function fetchEvents(leagueId) {
  const res = await axios.get(`${API_BASE}/eventsnextleague.php`, { params: { id: leagueId } });
  return res.data.events || [];
}

async function fetchEventDetail(eventId) {
  const res = await axios.get(`${API_BASE}/lookupevent.php`, { params: { id: eventId } });
  return res.data.events ? res.data.events[0] : null;
}

async function storeLeagues(leagues) {
  for (const lg of leagues) {
    await prisma.league.upsert({
      where: { externalId: lg.idLeague },
      update: { name: lg.strLeague, country: lg.strCountry },
      create: {
        externalId: lg.idLeague,
        name: lg.strLeague,
        country: lg.strCountry,
      },
    });
  }
}

async function storeEvents(leagueId, events) {
  const league = await prisma.league.findUnique({ where: { externalId: leagueId } });
  if (!league) return;
  for (const ev of events) {
    await prisma.event.upsert({
      where: { externalId: ev.idEvent },
      update: { name: ev.strEvent, date: ev.dateEvent ? new Date(ev.dateEvent) : null },
      create: {
        externalId: ev.idEvent,
        name: ev.strEvent,
        date: ev.dateEvent ? new Date(ev.dateEvent) : null,
        leagueId: league.id,
        details: ev.strDescriptionEN,
      },
    });
  }
}

app.get('/', async (req, res) => {
  res.render('index');
});

app.post('/search', async (req, res) => {
  const { country } = req.body;
  const leagues = await fetchLeagues(country);
  await storeLeagues(leagues);
  res.render('leagues', { leagues });
});

app.get('/leagues', async (req, res) => {
  const leagues = await prisma.league.findMany();
  res.render('leagues', { leagues });
});

app.get('/events/:leagueId', async (req, res) => {
  const leagueId = req.params.leagueId;
  const events = await fetchEvents(leagueId);
  await storeEvents(leagueId, events);
  res.render('events', { events });
});

app.get('/event/:eventId', async (req, res) => {
  const event = await fetchEventDetail(req.params.eventId);
  if (event) {
    await prisma.event.upsert({
      where: { externalId: event.idEvent },
      update: { details: event.strDescriptionEN },
      create: {
        externalId: event.idEvent,
        name: event.strEvent,
        date: event.dateEvent ? new Date(event.dateEvent) : null,
        details: event.strDescriptionEN,
        league: { connect: { externalId: event.idLeague } },
      },
    });
  }
  res.render('event', { event });
});

cron.schedule('0 */12 * * *', async () => {
  const leagues = await prisma.league.findMany();
  for (const lg of leagues) {
    const events = await fetchEvents(lg.externalId);
    await storeEvents(lg.externalId, events);
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
