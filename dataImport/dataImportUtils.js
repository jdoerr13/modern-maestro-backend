const axios = require('axios');
const fs = require('fs');
const csv = require('csv-parser');

// Function to fetch data from an external API
async function fetchDataFromAPI(apiUrl) {
  try {
    const response = await axios.get(apiUrl);
    return response.data; // Assuming the API returns the composition data directly
  } catch (error) {
    console.error('Error fetching data from API:', error);
    throw error;
  }
}

// Function to import compositions from a CSV file
async function importCompositionsFromCSV(filePath) {
  const compositions = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => compositions.push(row))
      .on('end', () => {
        console.log('CSV file successfully processed');
        resolve(compositions);
      })
      .on('error', reject);
  });
}

// Function to update the database with compositions from both CSV and an API
async function updateCompositionsDatabase(csvFilePath, apiUrl) {
  try {
    const compositionsFromCSV = await importCompositionsFromCSV(csvFilePath);
    const compositionsFromAPI = await fetchDataFromAPI(apiUrl);
    
    // Combine data from CSV and API
    const combinedCompositions = [...compositionsFromCSV, ...compositionsFromAPI];
    
    // Insert or update your database with combinedCompositions
    // This step depends on your database setup; you might use SQL queries or an ORM
    console.log('Combined compositions ready for database insertion:', combinedCompositions);
    // Implement the database insertion logic here
  } catch (error) {
    console.error('Error updating compositions database:', error);
  }
}

module.exports = { fetchDataFromAPI, importCompositionsFromCSV, updateCompositionsDatabase };