import dotenv from 'dotenv';
import OpenAI from 'openai';
dotenv.config();

import {
  enrichProject,
  enrichProjectsBatch
} from '../src/api/services/automation.service';

// async function testEnrichment() {
//   try {
//     console.log('Starting enrichment test...');
//     // const result = await enrichProject(2); // Replace 1 with your projectId
//     const result = await enrichProjectsBatch([1, 2, 3, 4]);
//     console.log('Enrichment successful:', JSON.stringify(result, null, 2));
//   } catch (error) {
//     console.error('Error:', error);
//     process.exit(1);
//   }
// }

// testEnrichment().then(() => {
//   console.log('Test completed');
//   process.exit(0);
// });

const client = new OpenAI();

async function test() {
  console.log('test');
  const response = await client.responses.create({
    model: 'gpt-5',
    tools: [{ type: 'web_search' }],
    input: `Enrich this json with missing data:
    {
    "id": 5,
    "name": "Forma East Tower",
    "buildingHeightMeters": 266,
    "buildingHeightFloors": null,
    "location": {
        "address": "",
        "city": "Toronto",
        "country": "Canada",
        "metroArea": "Toronto",
        "postcode": "",
        "coordinates": {
            "latitude": 0,
            "longitude": 0
        }
    },
    "expectedCompletionWindow": {
        "expected": null,
        "earliest": null,
        "latest": null
    },
    "buildingType": "Skyscraper",
    "buildingUse": [
        {
            "buildingUse": "residential"
        }
    ],
    "budgetEur": null,
    "glassFacade": null,
    "facadeBasis": "unknown",
    "status": "under_construction",
    "lastVerifiedDate": "2026-02-01T22:00:00.000Z",
    "confidenceScore": "Medium",
    "isActive": null,
    "projectWebsites": [
        {
            "id": null,
            "url": null
        }
    ],
    "developers": [
        {
            "name": null,
            "website": null,
            "contact": {
                "phone": null,
                "email": null
            }
        }
    ],
    "architects": [
        {
            "name": null,
            "website": null,
            "contact": {
                "phone": null,
                "email": null
            }
        }
    ],
    "contractors": [
        {
            "name": null,
            "website": null,
            "contact": {
                "phone": null,
                "email": null
            }
        }
    ],
    "media": [
        {
            "id": null,
            "mediaType": null,
            "url": null,
            "title": null,
            "filename": null
        }
    ],
    "sources": [
        {
            "id": 8,
            "url": "https://www.skyscrapercenter.com/building/forma-east-tower/16871",
            "sourceType": "database",
            "publisher": "The Skyscraper Center (Council on Vertical Urbanism &#x2F; CTBUH)",
            "accessedAt": "2026-02-02"
        },
        {
            "id": 9,
            "url": "https://urbantoronto.ca/news/2025/05/torontos-growing-skyline-9-supertall-projects-watch.58795",
            "sourceType": "media",
            "publisher": "UrbanToronto",
            "accessedAt": "2026-02-02"
        }
    ]
}`
  });

  console.log(response.output_text);
}

test();
