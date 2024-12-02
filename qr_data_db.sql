DROP DATABASE qr_data_db;
CREATE DATABASE qr_data_db;

USE qr_data_db;


CREATE TABLE scanned_data (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  usn VARCHAR(255) NOT NULL,
  branch VARCHAR(255) NOT NULL,
  dob DATE NOT NULL,
  passout YEAR NOT NULL,
  mobile_no VARCHAR(15) NOT NULL
);
-- ALTER TABLE scanned_data 
-- MODIFY dob DATE NULL,
-- MODIFY passout INT NULL,
-- MODIFY mobile_no VARCHAR(15) NULL;






