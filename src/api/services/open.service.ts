import OpenAI from 'openai';

import { zodTextFormat } from 'openai/helpers/zod';
import { ProjectSchema } from '../../schemas/projectSchema';
import ProjectsListSchema from '../../schemas/projectsListSchema';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Parse user query into structured search parameters
export const parseSearchQuery = async (query: string) => {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are a search query parser for construction projects. 
Extract structured data from user queries.
Return JSON with: metroArea, projectType, status, minHeight, keywords.`
      },
      {
        role: 'user',
        content: query
      }
    ],
    response_format: { type: 'json_object' }
  });

  return JSON.parse(response.choices[0].message.content || '{}');
};

// Generate web search query from parsed data
export const generateSearchQuery = async (
  parsedQuery: any
): Promise<string> => {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content:
          'Generate an effective web search query for construction/real estate projects based on these parameters.'
      },
      {
        role: 'user',
        content: JSON.stringify(parsedQuery)
      }
    ]
  });

  return response.choices[0].message.content || '';
};

// Extract project data from web page content
export const extractProjectData = async (htmlContent: string, url: string) => {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `Extract construction project information from this webpage.
Return JSON with: name, location (address, city, country, metroArea, coordinates), 
developers, architects, contractors (with contact info), 
buildingType, buildingUse[], status, expectedCompletion, 
budgetEur, glassFacade, buildingHeightMeters, buildingHeightFloors, media[], sources[].

If data not found, use null. Be accurate.`
      },
      {
        role: 'user',
        content: `URL: ${url}\n\nContent:\n${htmlContent.slice(0, 15000)}`
      }
    ],
    response_format: { type: 'json_object' }
  });

  return JSON.parse(response.choices[0].message.content || '{}');
};

// Extract company names from query
export const parseCompanyQuery = async (query: string) => {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `Extract company names and location from the query.
Return JSON with: companies[] (array of company names), metroArea, country.`
      },
      {
        role: 'user',
        content: query
      }
    ],
    response_format: { type: 'json_object' }
  });

  return JSON.parse(response.choices[0].message.content || '{}');
};

// Extract enrichment data from multiple sources
export const extractEnrichmentData = async (
  projectName: string,
  cityName: string,
  sources: Array<{ url: string; content: string }>
) => {
  // Combine all content with source URLs
  const combinedContent = sources
    .filter((s) => s.content)
    .map((s) => `Source: ${s.url}\n${s.content.slice(0, 5000)}`)
    .join('\n\n---\n\n');

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are enriching data for a construction project. 
Project: ${projectName} in ${cityName}

From the provided web sources, extract and return JSON with:
{
  "name": string or null,
  "location": {
    "address": string or null,
    "city": string or null,
    "country": string or null,
    "metroArea": string or null,
    "coordinates": {
      "latitude": number or null,
      "longitude": number or null
    } or null
  },
  "buildingType": string or null,
  "buildingUse": [string] or null, 
  "buildingHeightMeters": number or null,
  "buildingHeightFloors": number or null,
  "status": "planned" | "approved" | "proposed" | "under_construction" | "on_hold" | null,
  "budgetEur": number or null,
  "glassFacade": "yes" | "no" | null,
  "facadeBasis": "renderings" | "construction_photos" | "architectural_specs" | "mixed" | null,
  "expectedCompletion": {
    "expected": string or null,
    "earliest": string or null,
    "latest": string or null
  },
  "developers": [{ "name": string, "source": string or null, "website": string or null, "contact": { "email": string or null, "phone": string or null }}],
  "architects": [{ "name": string, "source": string or null, "website": string or null, "contact": { "email": string or null, "phone": string or null }}],
  "contractors": [{ "name": string, "source": string or null, "website": string or null, "contact": { "email": string or null, "phone": string or null }}],
  "projectWebsites": [string],
  "media": [{ "url": string, "title": string or null, "mediaType": "rendering" | "photo" | "other" }]
}

Only include data you find with high confidence. Use null if not found.
Be conservative - don't guess or infer.`
      },
      {
        role: 'user',
        content: `Sources:\n\n${combinedContent.slice(0, 20000)}`
      }
    ],
    response_format: { type: 'json_object' }
  });

  return JSON.parse(response.choices[0].message.content || '{}');
};

// export const openAIWebSearch = async (projectJSON: any) => {
//   const response = await openai.responses.create({
//     model: 'gpt-5',
//     tools: [{ type: 'web_search' }],
//     input: `Enrich this json with missing data, add more details where possible.
//     If a direct image URL (ending .jpg/.png/.webp) cannot be reliably obtained,
//     set media.url to "" and do NOT place the webpage URL there.
//     There should be pictures available for most projects, so try to find them and post the diect image URL
//     in the media.url field. Do not fabricate image URLs.
//     instead put the webpage under projectWebsites or sources :
//     ${JSON.stringify(projectJSON)}`
//   });
//   return response;
// };

export const openAIWebSearchList = async (
  location: string,
  buildingType: string,
  existingProjectNames: string[]
) => {
  const response = await openai.responses.create({
    model: 'gpt-5',
    tools: [{ type: 'web_search' }],
    include: ['web_search_call.action.sources'],
    input: [
      {
        role: 'system',
        content: `You enrich a list of building projects JSON.
Return ONLY valid JSON that matches the provided schema. Do not add extra keys.
TASK
Using public web sources and reputable construction/real-estate databases, identify projects in [LOCATION] matching [TYPE] that are ongoing or upcoming.

Do NOT provide a shortlist — include every project you can verify that fits.
Explicitly EXCLUDE projects that are cancelled, shelved, or abandoned.

LOCATION SCOPE
Metro area — include projects within the broader metropolitan area (including surrounding municipalities commonly considered part of the metro region).

BUILDING TYPE PARAMETER (INPUT)
[TYPE] = one or more of:
A — Skyscraper (over 150 m)
B — High-rise (50–150 m)
C — Major civic or commercial building
D — Industrial building

BUILDING TYPE (OUTPUT — USE ONLY THESE LABELS)
"Skyscraper" | "High-rise" | "Major civic or commercial building" | "Industrial building"

BUILDING USE (OUTPUT — USE ONLY THESE VALUES)
"office" | "residential" | "mixed-use" | "hotel" | "hospital" | "education" | "retail" | "cultural" | "industrial" | "logistics" | "data_center" | "other"
Note: buildingUse is an ARRAY. Include all applicable uses (1+). If unclear, use ["other"].

STATUS (OUTPUT — USE ONLY THESE VALUES)
"planned" | "approved" | "proposed" | "under_construction" | "on_hold" | "completed"

Here are the projects already in the database for this location/type (do not include these in your results, but use them to avoid duplicates and to help identify new projects):
${existingProjectNames.length > 0 ? existingProjectNames.join('\n') : 'None'}

INCLUSION / EXCLUSION RULES

Include only if status is: planned, approved, proposed, under_construction, on_hold, or (optionally) very recently completed.

Exclude if explicitly described as: cancelled, shelved, abandoned.

If status is unclear/conflicting: include ONLY if at least one recent, credible source indicates the project is still active.

RESEARCH SOURCES TO USE
Use a combination of:
1) Public web sources: developer/architect sites, official project sites, planning authority portals, municipal zoning/permit records, press releases, reputable news/industry publications, local planning/permitting sources, local news/local newspapers.
2) Wikipedia cross-check ONLY to estimate expected project count via “tallest buildings for [LOCATION]” — but confirm projects via authoritative sources.
3) Structured databases (where accessible): Emporis, CTBUH, SkyscraperPage, BCI Central, Dodge Construction Network, BuildZoom, municipal/regional planning databases.


DATA QUALITY RULES (STRICT)

Do NOT speculate or invent projects.

Prioritize the most recent and authoritative sources.

If estimated completion is unknown or not stated, set expectedCompletionWindow.expected to "" (do not guess).

If only a year or month-year is known, store it as given (e.g., "2027" or "2027-10") rather than inventing a full date.

If a precise street address is unavailable, provide the most specific reliable location (district/block/intersection) without guessing.

lastVerifiedDate must reflect when you confirmed the info (use today’s date when verifying now).

OUTPUT FORMAT — ABSOLUTE REQUIREMENTS

Output MUST be ONLY valid JSON (no markdown, no commentary).

Output MUST be a single JSON object with exactly one top-level key: "projects".

Each project must have ALL fields present exactly as specified below.

Unknown values: use "" for unknown text fields; use [] only where the schema defines an array; use null for unknown numeric values.

JSON OUTPUT SCHEMA (MUST MATCH EXACTLY)
{
"projects": [
{
"name": "",
"buildingType": "Skyscraper" | "High-rise" | "Major civic or commercial building" | "Industrial building",
"buildingUse": [
"office" | "residential" | "mixed-use" | "hotel" | "hospital" | "education" | "retail" | "cultural" | "industrial" | "logistics" | "data_center" | "other"
],
"address": "",
"city": "",
"metroArea": "",
"country": "",
"continent": "",
"status": "planned" | "approved" | "proposed" | "under_construction" | "on_hold" | "completed",
"expectedDateText": "",
"lastVerifiedDate": "YYYY-MM-DD"
}
]
}

PARAMETERS (INPUT)
[TYPE] = A | B | C | D 
[LOCATION] = Metro area name eg Location Metropolitan Area, Greater Location Area.`
      },
      {
        role: 'user',
        content: `
Enrich these projects with missing data and add details where you can verify them.

Context parameters:
- [LOCATION]: ${location}
- [TYPE]: ${buildingType}

Rules:
- Do not fabricate facts.
- lastVerifiedDate must be today in YYYY-MM-DD format for every project in projects[].

        `.trim()
      }
    ],
    text: { format: zodTextFormat(ProjectsListSchema, 'projectsList') }
  });
  return response;
};

export const openAIWebSearch = async (projectJSON: any) => {
  const response = await openai.responses.parse({
    model: 'gpt-5',
    tools: [{ type: 'web_search' }],
    include: ['web_search_call.action.sources'],
    input: [
      {
        role: 'system',
        content: `You enrich a single building project JSON. 
      Return ONLY valid JSON that matches the provided schema. Do not add extra keys.`
      },
      {
        role: 'user',
        content: `
          Enrich this project with missing data and add details where you can verify them.

          Rules:
          - Do not fabricate facts.
          - Add sources for any new or changed fields where possible.
          - lastVerifiedDate must be today in YYYY-MM-DD format.
          - Images: media.url must be a direct image URL ending .jpg/.png/.webp if reliably found.
            If not, set media.url to "" and put the page URL into projectWebsites or sources instead.

          Project JSON:
          ${JSON.stringify(projectJSON)}
          `.trim()
      }
    ],
    text: { format: zodTextFormat(ProjectSchema, 'project') }
  });

  return response;
};
