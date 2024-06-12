const axios = require('axios');
const qs = require('querystring');
require('dotenv').config({ path: __dirname + '/../.env' });
const { Composition, syncCompositionModel } = require('../models/composition'); // Adjust path as necessary
const { Composer, syncComposerModel } = require('../models/composer'); // Adjust the path as necessary

const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;


async function getSpotifyAccessToken() {
    const tokenUrl = 'https://accounts.spotify.com/api/token';
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const data = qs.stringify({ grant_type: 'client_credentials' });

    try {
        const response = await axios.post(tokenUrl, data, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${credentials}`
            }
        });
        return response.data.access_token;
    } catch (error) {
        console.error('Failed to authenticate with Spotify:', error);
        throw error;
    }
}

async function fetchMusicDataFromSpotify(query) {
    const accessToken = await getSpotifyAccessToken();
    const apiUrl = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&market=US&limit=50`;

    try {
        const response = await axios.get(apiUrl, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        console.log('Spotify API Response:', response.data); // Log the Spotify API response
        return response.data.tracks.items; // Directly return the tracks
    } catch (error) {
        console.error('Failed to fetch data from Spotify:', error);
        throw error;
    }
}

async function processAndInsertData(tracks, composerNameOverride = null) {
    if (tracks.length === 0) {
        console.error('No tracks found in the data');
        return;
    }
    for (const track of tracks) {
        const composerName = composerNameOverride || track.artists[0].name;
        const composer_id = await findOrCreateComposer(composerName);
        const yearOfComposition = new Date(track.album.release_date).getFullYear();
        
        const existingComposition = await Composition.findOne({
            where: {
                title: track.name,
                composer_id: composer_id,
                year_of_composition: yearOfComposition,
            }
        });
        const durationInSeconds = Math.round(track.duration_ms / 1000);
        const minutes = Math.floor(durationInSeconds / 60);
        const seconds = durationInSeconds % 60;

// Format the duration as "M:SS"
const formattedDuration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        if (!existingComposition) {
            const compositionData = {
                title: track.name,
                composer_id: composer_id,
                year_of_composition: yearOfComposition,
                description: `${track.name} from the album ${track.album.name} by ${composerName}.`,
                duration: formattedDuration,
                instrumentation: JSON.stringify(["Not specified"]),
                external_api_name: "www.spotify.com",
            };

            await Composition.create(compositionData);
            console.log(`Inserted composition: ${compositionData.title}`);
        } else {
            console.log(`Skipping duplicate composition: ${existingComposition.title}`);
        }
    }
}


async function findOrCreateComposer(composerName) {
    let composer = await Composer.findByComposerName(composerName);
    if (!composer) {
        // Assuming Composer.create returns the created composer object
        composer = await Composer.create({ name: composerName });
    }
    return composer.composer_id;
}

async function fetchTracksByArtistAndProcess(artistName) {
    const composerName = artistName; // Here, map or transform artistName to composerName if needed
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 10; // Calculate the start year for the last 10 years range

    // Update the query to include both the artist name and the year range
    const query = `artist:${artistName} year:${startYear}-${currentYear}`;
    const tracks = await fetchMusicDataFromSpotify(query);
    await processAndInsertData(tracks, composerName);
}

async function fetchTracksFromPlaylist(playlistId) {
    const accessToken = await getSpotifyAccessToken();
    const apiUrl = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?market=US&limit=50`;

    try {
        const response = await axios.get(apiUrl, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });
        console.log('Spotify Playlist Tracks API Response:', response.data);
        // Adjusted the path to correctly access the items array
        const tracks = response.data.tracks.items.map(item => item.track);
        return tracks;
    } catch (error) {
        console.error('Failed to fetch playlist tracks from Spotify:', error);
        throw error;
    }
}

//USED ONLY FOR FRONT END
async function fetchTracksByComposerName(composerName) {
    const accessToken = await getSpotifyAccessToken();
    const apiUrl = `https://api.spotify.com/v1/search?q=artist:${encodeURIComponent(composerName)}&type=track&market=US&limit=50`;
  
    try {
      const response = await axios.get(apiUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      console.log('Spotify API Response:', response.data);
      return response.data.tracks.items.map(track => ({
        name: track.name,
        artists: track.artists.map(artist => artist.name),
        preview_url: track.preview_url,
        duration: formatDuration(track.duration_ms), // Assuming you have a helper function to format the duration
        year: track.album.release_date.slice(0, 4), // Extracting the year from the release date
        album: track.album.name // Getting the album name
      }));
    } catch (error) {
      console.error('Failed to fetch data from Spotify:', error);
      throw error;
    }
}

// Helper function to format duration from milliseconds to minutes:seconds
function formatDuration(durationMs) {
    const minutes = Math.floor(durationMs / 60000);
    const seconds = ((durationMs % 60000) / 1000).toFixed(0);
    return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
}



(async () => {
    try {
        await syncCompositionModel();
        await syncComposerModel();
        // Fetch and process tracks by a specific artist
        await fetchTracksByArtistAndProcess("Hans Zimmer");
        
    // Fetch and process tracks by a specific playlist
        // const playlistId = '0cvzO2xWgRjWRQ6zkY9ij5?si=2515637d83a34af7'; // https://open.spotify.com/playlist/4hOKQuZbraPDIfaGbM3lKI. The playlist ID is the alphanumeric string after playlist/, which in this example is 4hOKQuZbraPDIfaGbM3lKI.
        // const playlistTracks = await fetchTracksFromPlaylist(playlistId);
        // await processAndInsertData(playlistTracks);      


        // fetch and process classical genre tracks from a specific year range
        // const currentYear = new Date().getFullYear();
        // const classicalQuery = `genre:classical year:2014-${currentYear}`;
        // const tracks = await fetchMusicDataFromSpotify(classicalQuery);
        // await processAndInsertData(tracks);
    } catch (error) {
        console.error('Error processing data:', error);
    }
})();

module.exports = {
    fetchTracksByComposerName,
};