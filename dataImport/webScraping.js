const axios = require('axios');
const cheerio = require('cheerio');

//or the course recomments using pandas external library if I scrape the web for data to clean and manipulate it

async function fetchCompositions(url) {
    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);
        const compositions = [];

        // Assuming each composition is listed within an element with the class 'composition'
        $('.composition').each((i, elem) => {
            const composition = {
                title: $(elem).find('h2').text(),
                composer: $(elem).find('.composer').text(),
                year: $(elem).find('.year').text(),
                // Add more fields as needed
            };
            compositions.push(composition);
        });

        console.log(compositions);
        // Here you can further process, save, or export the compositions data
    } catch (error) {
        console.error('Error fetching compositions data:', error);
    }
}

// Replace 'http://example.com/new-compositions' with the actual URL you wish to scrape
fetchCompositions('http://example.com/new-compositions');
