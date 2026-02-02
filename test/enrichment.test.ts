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
    "id": 2,
    "name": "One Bloor West",
    "buildingHeightMeters": 309,
    "buildingHeightFloors": 85,
    "location": {
        "address": "",
        "city": "Toronto",
        "country": "Canada",
        "metroArea": "Toronto",
        "coordinates": {
            "latitude": 43.669916666666666,
            "longitude": -79.38702777777779
        }
    },
    "expectedCompletionWindow": {
        "expected": "2028",
        "earliest": "2028-01-01",
        "latest": "2028-12-31"
    },
    "buildingType": "Skyscraper",
    "buildingUse": [
        {
            "buildingUse": "residential"
        },
        {
            "buildingUse": "mixed-use"
        }
    ],
    "budgetEur": null,
    "glassFacade": "yes",
    "facadeBasis": "architectural_specs",
    "status": "under_construction",
    "lastVerifiedDate": "2026-02-01T22:00:00.000Z",
    "confidenceScore": "High",
    "isActive": null,
    "projectWebsites": [
        {
            "id": 3,
            "url": "https://en.wikipedia.org/wiki/One_Bloor_West"
        },
        {
            "id": 4,
            "url": "https://www.skyscrapercenter.com/building/one-bloor-west/18879"
        },
        {
            "id": 5,
            "url": "https://toronto.urbanize.city/post/one-bloor-west-becomes-canadas-first-supertall-skyscraper"
        },
        {
            "id": 6,
            "url": "https://www.dezeen.com/2025/06/26/canadas-toronto-supertall-skyscraper-one-bloor-west/"
        }
    ],
    "developers": [
        {
            "name": "Tridel",
            "website": null,
            "contact": {
                "phone": null,
                "email": null
            }
        },
        {
            "name": "Mizrahi Developments",
            "website": "",
            "contact": {
                "phone": "",
                "email": ""
            }
        }
    ],
    "architects": [
        {
            "name": "Foster + Partners",
            "website": "",
            "contact": {
                "phone": "",
                "email": ""
            }
        },
        {
            "name": "Core Architects",
            "website": "",
            "contact": {
                "phone": "",
                "email": ""
            }
        },
        {
            "name": "Foster and Partners",
            "website": "https://www.fosterandpartners.com/",
            "contact": {
                "phone": null,
                "email": null
            }
        }
    ],
    "contractors": [
        {
            "name": "Tridel",
            "website": "",
            "contact": {
                "phone": "",
                "email": ""
            }
        }
    ],
    "media": [
        {
            "id": 4,
            "mediaType": "photo",
            "url": "https://toronto.urbanize.city/sites/default/files/styles/social_1200x630/public/background/2025-06/DSC00787.jpeg?itok=aAJ9YjRd",
            "title": "One Bloor West",
            "filename": null
        },
        {
            "id": 5,
            "mediaType": "photo",
            "url": "https://static.dezeen.com/uploads/2025/06/one-bloor-west-toronto-canada-tridel_dezeen_2364_sq-1.jpg",
            "title": "One Bloor West under construction",
            "filename": null
        }
    ],
    "sources": [
        {
            "id": 3,
            "url": "https://www.skyscrapercenter.com/building/the-one/18879",
            "sourceType": "database",
            "publisher": "The Skyscraper Center (Council on Vertical Urbanism &#x2F; CTBUH)",
            "accessedAt": "2026-02-02"
        },
        {
            "id": 4,
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
