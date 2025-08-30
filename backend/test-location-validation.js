const Joi = require('joi');

// Test the location validation schema
const locationSchema = Joi.object({
  lat: Joi.number().min(-90).max(90).required(),
  lng: Joi.number().min(-180).max(180).required()
});

// Test the submitVerification schema
const submitVerificationSchema = Joi.object({
  shopName: Joi.string().trim().min(2).max(100).required(),
  shopAddress: Joi.object({
    street: Joi.string().trim().min(5).max(200).required(),
    city: Joi.string().trim().min(2).max(50).required(),
    state: Joi.string().trim().min(2).max(50).required(),
    zipCode: Joi.string().trim().min(3).max(10).required(),
    country: Joi.string().trim().min(2).max(50).required()
  }).required(),
  location: Joi.object({
    lat: Joi.number().min(-90).max(90).required(),
    lng: Joi.number().min(-180).max(180).required()
  }).required(),
  gstNumber: Joi.string().trim().max(15).optional(),
  documentType: Joi.string().valid('aadhar', 'pan', 'driving_license', 'shop_license', 'other').required()
});

console.log('Testing location validation...\n');

// Test 1: Valid location
console.log('Test 1: Valid location');
const validLocation = { lat: 40.7128, lng: -74.0060 };
const result1 = locationSchema.validate(validLocation);
console.log('Result:', result1.error ? 'FAILED' : 'PASSED');
if (result1.error) console.log('Error:', result1.error.details);

// Test 2: Invalid latitude
console.log('\nTest 2: Invalid latitude (too high)');
const invalidLat = { lat: 91, lng: -74.0060 };
const result2 = locationSchema.validate(invalidLat);
console.log('Result:', result2.error ? 'PASSED (correctly rejected)' : 'FAILED (should have rejected)');
if (result2.error) console.log('Error:', result2.error.details);

// Test 3: Missing longitude
console.log('\nTest 3: Missing longitude');
const missingLng = { lat: 40.7128 };
const result3 = locationSchema.validate(missingLng);
console.log('Result:', result3.error ? 'PASSED (correctly rejected)' : 'FAILED (should have rejected)');
if (result3.error) console.log('Error:', result3.error.details);

// Test 4: Valid verification data
console.log('\nTest 4: Valid verification data with location');
const validVerification = {
  shopName: 'Test Shop',
  shopAddress: {
    street: '123 Test Street',
    city: 'Test City',
    state: 'Test State',
    zipCode: '12345',
    country: 'Test Country'
  },
  location: { lat: 40.7128, lng: -74.0060 },
  documentType: 'aadhar'
};
const result4 = submitVerificationSchema.validate(validVerification);
console.log('Result:', result4.error ? 'FAILED' : 'PASSED');
if (result4.error) console.log('Error:', result4.error.details);

// Test 5: Invalid verification data (missing location)
console.log('\nTest 5: Invalid verification data (missing location)');
const invalidVerification = {
  shopName: 'Test Shop',
  shopAddress: {
    street: '123 Test Street',
    city: 'Test City',
    state: 'Test State',
    zipCode: '12345',
    country: 'Test Country'
  },
  documentType: 'aadhar'
};
const result5 = submitVerificationSchema.validate(invalidVerification);
console.log('Result:', result5.error ? 'PASSED (correctly rejected)' : 'FAILED (should have rejected)');
if (result5.error) console.log('Error:', result5.error.details);

console.log('\nLocation validation tests completed!');
