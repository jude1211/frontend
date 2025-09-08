// Simple test script to demonstrate DirectMyLocation functionality
// This can be run in the browser console to test the location detection

// Test the findClosestSupportedCity function
const POPULAR_CITIES = ['Mumbai', 'Delhi-NCR', 'Bengaluru', 'Hyderabad', 'Ahmedabad', 'Chandigarh', 'Chennai', 'Pune', 'Kolkata', 'Kochi'];

const cityVariations = {
  'bombay': 'Mumbai',
  'calcutta': 'Kolkata',
  'madras': 'Chennai',
  'bangalore': 'Bengaluru',
  'gurgaon': 'Delhi-NCR',
  'noida': 'Delhi-NCR',
  'ghaziabad': 'Delhi-NCR',
  'faridabad': 'Delhi-NCR',
  'gurugram': 'Delhi-NCR',
  'new delhi': 'Delhi-NCR',
  'old delhi': 'Delhi-NCR',
  'cochin': 'Kochi',
  'ahmedabad': 'Ahmedabad',
  'pune': 'Pune',
  'hyderabad': 'Hyderabad',
  'chandigarh': 'Chandigarh',
  'chennai': 'Chennai',
  'kolkata': 'Kolkata',
  'kochi': 'Kochi',
  'mumbai': 'Mumbai',
  'bengaluru': 'Bengaluru',
  'delhi': 'Delhi-NCR'
};

function findClosestSupportedCity(detectedCity) {
  const detectedCityLower = detectedCity.toLowerCase();
  
  // Direct match
  const directMatch = POPULAR_CITIES.find(city => 
    city.toLowerCase() === detectedCityLower
  );
  if (directMatch) return directMatch;
  
  // Partial match
  const partialMatch = POPULAR_CITIES.find(city => 
    city.toLowerCase().includes(detectedCityLower) || 
    detectedCityLower.includes(city.toLowerCase())
  );
  if (partialMatch) return partialMatch;
  
  // Check variations
  const variationMatch = cityVariations[detectedCityLower];
  if (variationMatch) return variationMatch;
  
  return null;
}

// Test cases
console.log('Testing DirectMyLocation city matching:');
console.log('----------------------------------------');

const testCases = [
  'Mumbai',
  'Bombay',
  'Delhi',
  'Gurgaon',
  'Bangalore',
  'Chennai',
  'Madras',
  'Kolkata',
  'Calcutta',
  'Unknown City'
];

testCases.forEach(city => {
  const result = findClosestSupportedCity(city);
  console.log(`${city} → ${result || 'Not supported'}`);
});

console.log('\nTesting location detection simulation:');
console.log('--------------------------------------');

// Simulate location detection
async function simulateLocationDetection(cityName) {
  console.log(`Detecting location for: ${cityName}`);
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const supportedCity = findClosestSupportedCity(cityName);
  
  if (supportedCity) {
    console.log(`✅ Successfully detected: ${supportedCity}`);
    return { city: supportedCity };
  } else {
    console.log(`❌ Could not detect city: ${cityName} is not supported`);
    return { error: `City "${cityName}" not found in supported cities.` };
  }
}

// Run simulation tests
async function runTests() {
  const testCities = ['Mumbai', 'Bombay', 'Gurgaon', 'Unknown City'];
  
  for (const city of testCities) {
    const result = await simulateLocationDetection(city);
    console.log(`Result:`, result);
    console.log('---');
  }
}

// Uncomment to run tests
// runTests();

console.log('\nTo test the actual location detection:');
console.log('1. Open the app in your browser');
console.log('2. Click on the city selector in the header');
console.log('3. Click "Detect My Location"');
console.log('4. Grant location permission when prompted');
console.log('5. Watch the detection process and results');

console.log('\nDebug features available:');
console.log('- Coordinates display for troubleshooting');
console.log('- Retry functionality (up to 3 attempts)');
console.log('- Detailed error messages');
console.log('- Manual city selection as fallback'); 