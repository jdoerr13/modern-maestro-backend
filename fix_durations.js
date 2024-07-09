const fs = require('fs');
const path = require('path');

const inputFilePath = path.join(__dirname, 'compositions_data.sql');
const outputFilePath = path.join(__dirname, 'compositions_data_fixed.sql');

// Read the SQL file
fs.readFile(inputFilePath, 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading file:', err);
        return;
    }

    // Log the initial content of the file
    console.log('Original file content:', data);

    // Regular expression to find durations in 'MM:SS' format
    const durationRegex = /'(\d{2}:\d{2})'/g;

    // Replace 'MM:SS' durations with total seconds as integers
    const fixedData = data.replace(durationRegex, (match, p1) => {
        const [minutes, seconds] = p1.split(':').map(Number);
        const totalSeconds = minutes * 60 + seconds;
        return `'${totalSeconds}'`;
    });

    // Log the modified content of the file
    console.log('Fixed file content:', fixedData);

    // Write the fixed data to a new SQL file
    fs.writeFile(outputFilePath, fixedData, 'utf8', (err) => {
        if (err) {
            console.error('Error writing file:', err);
            return;
        }
        console.log('Fixed file has been created:', outputFilePath);
    });
});
