import dotenv from "dotenv";
import {readFileSync, writeFileSync} from "fs";
import {join, dirname} from "path";
import {fileURLToPath} from "url";

dotenv.config();

const DATA_PATH = join(dirname(fileURLToPath(import.meta.url)), "src/data/site.json");

function loadSiteData() {
    return JSON.parse(readFileSync(DATA_PATH, "utf8"));
}

function saveSiteData(data) {
    writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
    console.log("site.json updated.");
}

async function fetchGitHubContributions() {
    const TOKEN = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
    const USER = "keegan-t";

    async function graphql(query, variables = {}) {
        const res = await fetch("https://api.github.com/graphql", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${TOKEN}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({query, variables}),
        });
        const json = await res.json();
        if (json.errors) throw new Error(JSON.stringify(json.errors));
        return json.data;
    }

    const yearsData = await graphql(`
        query($login: String!) {
            user(login: $login) {
                contributionsCollection { contributionYears }
            }
        }
    `, {login: USER});

    const years = yearsData.user.contributionsCollection.contributionYears;
    let total = 0;

    for (const year of years) {
        const from = `${year}-01-01T00:00:00Z`;
        const to = `${year}-12-31T23:59:59Z`;
        const data = await graphql(`
            query($login: String!, $from: DateTime!, $to: DateTime!) {
                user(login: $login) {
                    contributionsCollection(from: $from, to: $to) {
                        contributionCalendar { totalContributions }
                    }
                }
            }
        `, {login: USER, from, to});
        const count = data.user.contributionsCollection.contributionCalendar.totalContributions;
        console.log(`  ${year}: ${count}`);
        total += count;
    }

    console.log(`GitHub lifetime contributions: ${total.toLocaleString()}`);
    return total;
}

async function fetchWhatPulse() {
    const KEY = process.env.WHATPULSE_API_KEY;
    const USER = process.env.WHATPULSE_USER_ID;

    const res = await fetch(`https://whatpulse.org/api/v1/users/${USER}`, {
        headers: {
            "Authorization": `Bearer ${KEY}`,
            "Accept": "application/json",
        },
    });

    const data = await res.json();
    const keys = data.user.totals.keys;
    console.log(`WhatPulse keys pressed: ${keys.toLocaleString()}`);
    return keys;
}

async function fetchTypeGGRaces() {
    const USER = process.env.TYPEGG_USERNAME;

    const res = await fetch(`https://api.typegg.io/v1/users/${USER}/races?sort=wpm&gamemode=multiplayer&per_page=10`);
    const data = await res.json();

    const top = await Promise.all(
        data.races.slice(0, 5).map(async (r) => {
            const player = r.match.players.find(p => p.username === USER);
            const wpm = player?.matchWpm ?? r.wpm;

            const qRes = await fetch(`https://api.typegg.io/v1/quotes/${r.quoteId}`);
            const qData = await qRes.json();

            return {
                quote: qData.text,
                cover: qData.source?.thumbnailUrl ?? null,
                wpm: Math.round(wpm * 100) / 100,
                acc: Math.round(r.accuracy * 10000) / 100,
                date: r.timestamp.slice(0, 10),
            };
        })
    );

    console.log(`TypeGG top ${top.length} races fetched.`);
    return top;
}

async function fetchLastFmPlays(artist, track) {
    const KEY = process.env.LASTFM_API_KEY;
    const USER = process.env.LASTFM_USER;

    const url = `https://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key=${KEY}&artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(track)}&username=${USER}&format=json`;
    const res = await fetch(url);
    const data = await res.json();

    const plays = parseInt(data?.track?.userplaycount ?? "0", 10);
    console.log(`  ${artist} - ${track}: ${plays} plays`);
    return plays;
}

// Run
const siteData = loadSiteData();

// GitHub contributions
const contributions = await fetchGitHubContributions();
siteData.coding.stats[0].value = contributions.toLocaleString();

// WhatPulse keypresses
const keys = await fetchWhatPulse();
const formatKeys = (n) => n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(1)}M`
    : n.toLocaleString();
siteData.coding.stats[1].value = formatKeys(keys);

// Years of coding
const yearsOfCoding = Math.floor((Date.now() - new Date("2015-12-31").getTime()) / (1000 * 60 * 60 * 24 * 365.25));
siteData.coding.stats[3].value = `${yearsOfCoding}+`;

// Last.fm play counts
console.log("Fetching Last.fm play counts...");
for (const track of siteData.music.tracks) {
    track.plays = await fetchLastFmPlays(track.artist, track.title);
}

// TypeGG races
const races = await fetchTypeGGRaces();
siteData.typing.races = races;

saveSiteData(siteData);
