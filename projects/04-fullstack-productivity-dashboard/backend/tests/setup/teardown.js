/**
 * Global Test Teardown
 * Runs after all tests complete
 */

module.exports = async () => {
  // Force exit if needed
  console.log('🏁 Test suite completed');
  
  // Give time for cleanup
  await new Promise(resolve => setTimeout(resolve, 500));
};
