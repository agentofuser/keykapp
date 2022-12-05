#!/usr/bin/env node

const fs = require('fs')

// Read the input file
try {
  const input = fs.readFileSync('wikipedia-character-frequencies.txt', 'utf8')

  // Split the input into lines
  const lines = input.split('\n')

  // Create an object to store the character frequencies
  const freqs = {}

  // Loop through each line
  for (const line of lines) {
    // Skip the line if it's a comment or contains non-printable ASCII characters
    if (/^#/.test(line) || /[^\x20-\x7E\n\t]/.test(line)) continue

    // Split the line into parts
    const parts = line.split('\t')

    // Get the character and its frequency
    const char = parts[0].replace(/^'|'$/g, '')
    const freq = parseInt(parts[2])

    // Skip the line if it has an empty character or null frequency
    if (char === '' || freq === null) continue

    // If the character is uppercase, add its frequency to the lowercase equivalent
    if (/[A-Z]/.test(char)) {
      // Initialize the frequency to 0 if it doesn't exist
      if (freqs[char.toLowerCase()] === undefined)
        freqs[char.toLowerCase()] = 0

      // Add the frequency
      freqs[char.toLowerCase()] += freq
    } else {
      // Initialize the frequency to 0 if it doesn't exist
      if (freqs[char] === undefined) freqs[char] = 0

      // Add the frequency
      freqs[char] += freq
    }

    // Print the frequencies object for debugging
    console.log(freqs)
  }

  // Convert the frequencies object to a JSON string
  let json
  try {
    json = JSON.stringify(freqs)
  } catch (err) {
    console.error(`Error converting to JSON: ${err.message}`)
    process.exit(1)
  }

  // Write the JSON string to the output file
  try {
    fs.writeFileSync('output.json', json)
  } catch (err) {
    console.error(`Error writing output file: ${err.message}`)
    process.exit(1)
  }
} catch (err) {
  console.error(`Error reading input file: ${err.message}`)
  process.exit(1)
}
