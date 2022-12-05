#!/usr/bin/env node

const fs = require('fs')

// Read the input file
const input = fs.readFileSync('wikipedia-character-frequencies.txt', 'utf8')

// Split the input into lines
const lines = input.split('\n')

// Create an object to store the character frequencies
const freqs = {}

// Loop through each line
for (const line of lines) {
  // Skip the line if it's a comment or contains non-printable ASCII characters
  if (/^#/.test(line) || /[^\x20-\x7E\n]/.test(line)) continue

  // Split the line into parts
  const parts = line.split('\t')

  // Get the character and its frequency
  const char = parts[0]
  const freq = parseInt(parts[2])

  // If the character is uppercase, add its frequency to the lowercase equivalent
  if (/[A-Z]/.test(char)) {
    // Initialize the frequency to 0 if it doesn't exist
    if (freqs[char.toLowerCase()] === undefined) freqs[char.toLowerCase()] = 0

    // Add the frequency
    freqs[char.toLowerCase()] += freq
  } else {
    // Initialize the frequency to 0 if it doesn't exist
    if (freqs[char] === undefined) freqs[char] = 0

    // Add the frequency
    freqs[char] += freq
  }
}

// Convert the frequencies object to a JSON string
const json = JSON.stringify(freqs)

// Write the JSON string to the output file
fs.writeFileSync('output.json', json)
