import OpenAI from 'openai';

import { zodTextFormat } from 'openai/helpers/zod';
import { ProjectSchema } from '../../schemas/projectSchema';
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
