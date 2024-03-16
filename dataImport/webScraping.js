require('dotenv').config({ path: __dirname + '/../.env' });
const axios = require('axios');
const cheerio = require('cheerio');
const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize('postgresql://localhost/modernmaestros');

// Assuming Composition and Composer models are defined as per your provided snippets
const { Composition, syncCompositionModel } = require('../models/composition');
const { Composer, syncComposerModel } = require('../models/composer');

// Fetches the duration from a composition's detail page
async function fetchCompositionDetails(compositionUrl) {
    try {
        const { data } = await axios.get(compositionUrl);
        const $ = cheerio.load(data);
        const duration = $('.avgDuration span').text().trim();
        return duration;
    } catch (error) {
        console.error(`Error fetching composition details from ${compositionUrl}:`, error);
        return null; // Return null if there's an error fetching the duration
    }
}

// Fetches compositions from the search URL and their details
async function fetchCompositions(searchUrl) {
    try {
        const { data } = await axios.get(searchUrl);
        const $ = cheerio.load(data);

        const compositionPromises = $('.composition').map(async (i, elem) => {
            const title = $(elem).find('.title a').text().trim();
            const composer = $(elem).find('.composer a').text().trim();
            const year = new Date().getFullYear(); // Defaulting to the current year
            const detailUrl = $(elem).find('.title a').attr('href');
            const duration = await fetchCompositionDetails(detailUrl);

            return {
                title,
                composer,
                year,
                duration
            };
        }).get(); // Convert cheerio object to array

        const compositions = await Promise.all(compositionPromises);

        // Process and insert compositions data into the database
        await processAndInsertCompositionsData(compositions);
        
    } catch (error) {
        console.error('Error fetching compositions data:', error);
    }
}

// Processes and inserts compositions data into the database
async function processAndInsertCompositionsData(compositions) {
    for (const composition of compositions) {
        const composer = await Composer.findByComposerName(composition.composer);
        const composer_id = composer.composer_id;

        const existingComposition = await Composition.findOne({
            where: {
                title: composition.title,
                duration: composition.duration,
            }
        });

        if (!existingComposition) {
            await Composition.create({
                composer_id: composer_id,
                title: composition.title,
                year_of_composition: composition.year,
                description: `Composition by ${composition.composer}`,
                duration: composition.duration,
                instrumentation: JSON.stringify(["Not specified"]),
                external_api_name: "www.allmusic.com",
            });
            console.log(`Inserted composition: ${composition.title}`);
        } else {
            console.log(`Skipping duplicate composition: ${existingComposition.title}`);
        }
    }
}

(async () => {
    try {
        await syncCompositionModel();
        await syncComposerModel();
        await fetchCompositions('https://www.allmusic.com/search/compositions/new+song+releases');
    } catch (error) {
        console.error('Error in running the script:', error);
    }
})();
