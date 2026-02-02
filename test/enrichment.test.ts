import dotenv from 'dotenv';
dotenv.config();

import {
  enrichProject,
  enrichProjectsBatch
} from '../src/api/services/automation.service';

async function testEnrichment() {
  try {
    console.log('Starting enrichment test...');
    // const result = await enrichProject(2); // Replace 1 with your projectId
    const result = await enrichProjectsBatch([1, 2, 3, 4]);
    console.log('Enrichment successful:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testEnrichment().then(() => {
  console.log('Test completed');
  process.exit(0);
});
