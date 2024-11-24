const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MySQL connection setup
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Sunkee@123', // Replace with your MySQL password
  database: 'qr_data_db', // Replace with your database name
});

// Connect to MySQL
db.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    process.exit(1);
  }
  console.log('Connected to MySQL database');
});

// Endpoint to save scanned data (QR Code)
app.post('/api/save-scanned-data', (req, res) => {
  const qrData = req.body.qrData;

  // Parse the scanned QR data
  const parsedData = parseScannedData(qrData);

  // Check for invalid parsed data
  if (!parsedData || parsedData.invalid) {
    return res.status(400).json({ message: 'Invalid QR Code data format' });
  }

  // Insert QR data into the database
  const query = `INSERT INTO scanned_data (name, usn, branch, dob, passout, mobile_no) 
                 VALUES (?, ?, ?, ?, ?, ?)`;

  const values = [
    parsedData.name,
    parsedData.usn,
    parsedData.branch,
    parsedData.dob || null,  // Ensure NULL for empty or invalid date
    parsedData.passout || null,  // Ensure NULL for invalid or empty passout year
    parsedData.mobile_no || null,  // Ensure NULL for invalid or empty mobile number
  ];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error('Error saving data:', err);
      return res.status(500).json({ message: 'Failed to save data' });
    }
    console.log('QR data saved:', result);
    res.status(200).json({ message: 'QR data saved successfully', userId: result.insertId });
  });
});

// Endpoint to save symptoms data
app.post('/api/save-symptoms-data', (req, res) => {
  const { userId, symptoms, severity, dateReported } = req.body;

  // Ensure that all required fields are present
  if (!userId || !symptoms || !severity || !dateReported) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  // Map symptom names to IDs
  const symptomIdsPromises = symptoms.map(symptom => {
    return new Promise((resolve, reject) => {
      const getSymptomIdQuery = 'SELECT id FROM symptoms WHERE symptom_name = ?';
      db.query(getSymptomIdQuery, [symptom], (err, result) => {
        if (err || result.length === 0) {
          reject(`Symptom "${symptom}" not found`);
        } else {
          resolve(result[0].id); // Return symptom_id
        }
      });
    });
  });

  // After resolving all symptom IDs, insert them into the user_symptoms table
  Promise.allSettled(symptomIdsPromises)
    .then(results => {
      const validSymptoms = results.filter(result => result.status === 'fulfilled').map(result => result.value);
      const invalidSymptoms = results.filter(result => result.status === 'rejected').map(result => result.reason);

      if (validSymptoms.length === 0) {
        return res.status(400).json({ message: 'No valid symptoms found.' });
      }

      // Create values for batch insert, including severity for each symptom
      const values = validSymptoms.map(symptomId => [
        userId, symptomId, severity, dateReported
      ]);

      // Insert into the user_symptoms table
      const insertSymptomsQuery = 'INSERT INTO user_symptoms (user_id, symptom_id, severity, date_reported) VALUES ?';
      db.query(insertSymptomsQuery, [values], (err, result) => {
        if (err) {
          console.error('Error saving symptoms data:', err);
          return res.status(500).json({ message: 'Failed to save symptoms data' });
        }

        // Respond with success
        res.status(200).json({ message: 'Symptoms data saved successfully' });
      });
    })
    .catch(error => {
      console.error(error);
      res.status(400).json({ message: error });
    });
});

// Function to validate date format (YYYY-MM-DD)
function isValidDate(date) {
  const regex = /^\d{4}-\d{2}-\d{2}$/; // Format: YYYY-MM-DD
  return regex.test(date);
}

// Function to validate integer values (e.g., passout year)
function isValidInteger(value) {
  return /^\d+$/.test(value); // Ensure value contains only digits
}

// Function to parse the scanned QR data (based on your format)
function parseScannedData(data) {
  const parts = data.split(" ");
  if (parts.length >= 10) { // Adjusted to expect at least 10 parts
    return {
      name: `${parts[0]} ${parts[1]} ${parts[2]}`.trim(), // Combine name parts
      usn: parts[3].trim(),
      branch: parts[6].trim(),
      dob: isValidDate(parts[7]) ? parts[7] : null,
      passout: isValidInteger(parts[8]) ? parts[8] : null,
      mobile_no: parts[9].trim()
    };
  } else {
    return { invalid: true }; // Mark as invalid if data format is incorrect
  }
}

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
