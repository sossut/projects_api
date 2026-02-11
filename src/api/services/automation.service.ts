import {
  parseSearchQuery,
  generateSearchQuery,
  extractProjectData,
  parseCompanyQuery,
  openAIWebSearch,
  openAIWebSearchList
} from './open.service';
import { searchWeb, fetchPageContent } from './search.service';

import {
  checkDeveloperExistsByName,
  postDeveloper
} from '../models/developerModel';

import { checkIfProjectExistsByKey, getProject } from '../models/projectModel';

import { toCamel } from '../../utils/utilities';
import { enrichProjectWithTavily } from './enrichmentTavily.service';

import {
  getProjectFirstPass,
  postProjectFirstPass
} from '../models/projectFirstPassModel';
import { postSearch } from '../models/searchModel';

import {
  addNewProjectToDB,
  applyEnrichedDataToProject
} from '../../utils/applyEnrichedDataToProject';

// Main automation service for project discovery
export const discoverProjects = async (userQuery: string) => {
  // Step 1: Parse user query with OpenAI
  const parsedQuery = await parseSearchQuery(userQuery);
  console.log('Parsed query:', parsedQuery);

  // Step 2: Generate optimized search query
  const searchQuery = await generateSearchQuery(parsedQuery);
  console.log('Search query:', searchQuery);

  // Step 3: Search web with Tavily
  const searchResults = await searchWeb(searchQuery, 10);
  console.log(`Found ${searchResults.length} results`);

  const discoveredProjects = [];

  // Step 4: Process each search result
  for (const result of searchResults) {
    try {
      // Fetch full page content
      const htmlContent = await fetchPageContent(result.url);
      if (!htmlContent) continue;

      // Step 5: Extract project data with OpenAI
      const projectData = await extractProjectData(htmlContent, result.url);

      if (!projectData.name || !projectData.location) {
        console.log(`Skipping ${result.url} - insufficient data`);
        continue;
      }

      // Step 6: Save to database (simplified - you'd use your full projectPost logic)
      // This is a basic example - expand with your full project creation flow
      console.log('Discovered project:', projectData.name);
      discoveredProjects.push({
        name: projectData.name,
        location: projectData.location,
        source: result.url
      });
    } catch (error) {
      console.error(`Error processing ${result.url}:`, error);
      continue;
    }
  }

  return {
    projectsFound: discoveredProjects.length,
    projects: discoveredProjects
  };
};

// Company-based search
export const discoverCompanyProjects = async (userQuery: string) => {
  // Step 1: Parse company query
  const parsedQuery = await parseCompanyQuery(userQuery);
  console.log('Parsed companies:', parsedQuery);

  const results = [];

  for (const companyName of parsedQuery.companies || []) {
    // Check if company exists
    let companyId = await checkDeveloperExistsByName(companyName);

    // Create if not exists
    if (companyId === 0) {
      companyId = await postDeveloper({
        name: companyName,
        website: 'test',
        hqCountryId: null,
        email: 'test',
        phone: 'test'
      });
    }

    // Search for company projects on web
    const searchQuery = `${companyName} construction projects ${parsedQuery.metroArea || ''}`;
    const searchResults = await searchWeb(searchQuery, 5);

    // Process results similar to above
    for (const result of searchResults) {
      const htmlContent = await fetchPageContent(result.url);
      if (!htmlContent) continue;

      const projectData = await extractProjectData(htmlContent, result.url);

      results.push({
        company: companyName,
        companyId,
        project: projectData.name,
        source: result.url
      });
    }
  }

  return {
    companiesProcessed: parsedQuery.companies?.length || 0,
    results
  };
};

// Enrich a single project with additional details using Tavily (backup method)

//first pass finding projects with GPT-5 web search
export const findProjectsWithGPT5 = async (
  location: string,
  buildingType: string
) => {
  console.log(`Finding type ${buildingType} projects in: ${location}`);
  try {
    let count = 0;
    const existingProjects = [];
    const resultsText = await openAIWebSearchList(location, buildingType);

    const results = JSON.parse(resultsText.output_text || '{}');
    console.log(results);
    for (const project of results.projects || []) {
      console.log(project);
      const p = {
        name: project.name,

        address: project.address,
        city: project.city,
        country: project.country,
        metroArea: project.metroArea,
        continent: project.continent,
        buildingHeightMeters: project.buildingHeightMeters || null,
        buildingType: project.buildingType,
        buildingUse: project.buildingUse,
        status: project.status,
        expectedDateText: project.expectedDateText,
        lastVerifiedDate: project.lastVerifiedDate,
        sources: project.sources
      };
      console.log('Found project:', JSON.stringify(p, null, 2));

      const key = `${p.name}|${p.city}|${p.country}`.toLowerCase();
      const checkIfProjectExistsByKeyFields =
        await checkIfProjectExistsByKey(key);
      if (!checkIfProjectExistsByKeyFields) {
        const newFirstPassProject = await postProjectFirstPass(p);
        count++;
        console.log(
          `Project "${p.name}" added to first pass table with ID ${newFirstPassProject}`
        );
      } else {
        existingProjects.push(key);
        console.log(
          `Project "${p.name}" already exists in the database, skipping.`
        );
      }
    }
    return {
      projectsFound: results.projects?.length || 0,
      projectsAdded: count,
      existingProjects
    };
  } catch (error) {
    console.error('Error finding projects with GPT-5:', error);
    throw error;
  }
};

export const enrichFirstPassProjectWithGPT5 = async (projectId: number) => {
  console.log(`Enriching first pass project ${projectId} with GPT-5`);
  try {
    // Fetch project from first pass table
    console.log('not yet implemented');
  } catch (error) {
    console.error(
      `Error enriching first pass project ${projectId} with GPT-5:`,
      error
    );
    throw error;
  }
};

// Enrich a single project from the main table with additional details using GPT-5 web search
export const enrichProjectWithGPT5 = async (projectId: number) => {
  const project = toCamel(await getProject(projectId));
  console.log(`Enriching project with GPT-5: ${project.name}`);

  try {
    // Build current project data as JSON

    const formattedProject = {
      id: project.id,
      name: project.name,
      buildingHeightMeters: project.buildingHeightMeters,
      buildingHeightFloors: project.buildingHeightFloors,
      location: {
        address: project.address.address,
        city: project.address.city.name,
        country: project.address.country.name,
        metroArea: project.address.metroArea.name,
        postcode: project.address.postcode,
        coordinates: project.address.location
      },
      expectedCompletionWindow: {
        expected: project.expectedDateText,
        earliest: project.earliestDateText,
        latest: project.latestDateText
      },
      buildingType: project.buildingType,
      buildingUse: project.buildingUses?.map((bu: any) => ({
        buildingUse: bu.buildingUse
      })),
      budgetEur: project.budgetEur,
      glassFacade: project.glassFacade,
      facadeBasis: project.facadeBasis,
      status: project.status,
      lastVerifiedDate: project.lastVerifiedDate,
      confidenceScore: project.confidenceScore,
      isActive: project.isActive,
      projectWebsites: project.projectWebsites,
      developers:
        project.developers?.map((dev: any) => ({
          name: dev.name,
          website: dev.contact?.website ?? dev.website,
          source: dev.source,
          contact: {
            phone: dev.contact?.phone ?? dev.phone,
            email: dev.contact?.email ?? dev.email
          }
        })) || [],
      architects:
        project.architects?.map((arch: any) => ({
          name: arch.name,
          website: arch.contact?.website ?? arch.website,
          source: arch.source,
          contact: {
            phone: arch.contact?.phone ?? arch.phone,
            email: arch.contact?.email ?? arch.email
          }
        })) || [],
      contractors:
        project.contractors?.map((cont: any) => ({
          name: cont.name,
          source: cont.source,
          website: cont.contact?.website ?? cont.website,
          contact: {
            phone: cont.contact?.phone ?? cont.phone,
            email: cont.contact?.email ?? cont.email
          }
        })) || [],
      media: project.projectMedias,
      sources: project.sourceLinks
    };

    // Single GPT-5 web search call
    const enrichedText = await openAIWebSearch(formattedProject);
    const enrichedData = JSON.parse(enrichedText.output_text || '{}');

    console.log('Enriched data:', JSON.stringify(enrichedData, null, 2));
    const enrichmentResult = await applyEnrichedDataToProject(
      projectId,
      project,
      enrichedData
    );

    return enrichmentResult;
  } catch (error) {
    console.error(`Error enriching project ${projectId}:`, error);
    throw error;
  }
};
export const enrichProjectAfterFirstPassWithGPT5 = async (
  firstPassProjectId: number
) => {
  console.log(`Enriching first pass project ${firstPassProjectId} with GPT-5`);
  try {
    // Fetch project from first pass table
    const firstPassProject = await getProjectFirstPass(firstPassProjectId);
    if (!firstPassProject) {
      throw new Error(
        `First pass project with ID ${firstPassProjectId} not found`
      );
    }
    console.log('First pass project data:', firstPassProject);
    // Build formatted project data for enrichment
    const formattedProject = {
      name: firstPassProject.name,
      buildingHeightMeters: firstPassProject.buildingHeightMeters,
      buildingHeightFloors: null,
      location: {
        address: firstPassProject.address,
        city: firstPassProject.city,
        country: firstPassProject.country,
        metroArea: firstPassProject.metroArea,
        postcode: null,
        coordinates: null
      },
      expectedCompletionWindow: {
        expected: firstPassProject.expectedDateText,
        earliest: '',
        latest: ''
      },
      buildingType: firstPassProject.buildingType,
      buildingUse: firstPassProject.buildingUse?.map((bu: any) => ({
        buildingUse: bu.buildingUse
      })),
      budgetEur: null,
      glassFacade: null,
      facadeBasis: null,
      status: firstPassProject.status,
      lastVerifiedDate: firstPassProject.lastVerifiedDate,
      confidenceScore: null,
      isActive: null,
      projectWebsites: [
        {
          id: null,
          url: null
        }
      ],
      developers: [
        {
          name: null,
          website: null,
          source: null,
          contact: {
            phone: null,
            email: null
          }
        }
      ],
      architects: [
        {
          name: null,
          website: null,
          source: null,
          contact: {
            phone: null,
            email: null
          }
        }
      ],
      contractors: [
        {
          name: null,
          source: null,
          website: null,
          contact: {
            phone: null,
            email: null
          }
        }
      ],
      media: [
        {
          id: null,
          mediaType: null,
          url: null,
          title: null,
          filename: null,
          sourcePage: null
        }
      ],
      sources: [
        {
          id: null,
          url: null,
          sourceType: null,
          publisher: null,
          publishedDate: null
        }
      ]
    };
    console.log('Formatted project for enrichment:', formattedProject);
    // Single GPT-5 web search call
    const enrichedText = await openAIWebSearch(formattedProject);
    const enrichedData = JSON.parse(enrichedText.output_text || '{}');
    console.log('Enriched data:', JSON.stringify(enrichedData, null, 2));
    // Here you would implement logic to update the first pass project with the enriched data
    // Similar to enrichProjectWithGPT5 but updating the first pass table instead
    const project = await addNewProjectToDB(enrichedData);
    return project;
  } catch (error) {
    console.error(
      `Error enriching first pass project ${firstPassProjectId} with GPT-5:`,
      error
    );
    throw error;
  }
};
// Main enrichment function - switches between GPT-5 and Tavily based on config
export const enrichProject = async (projectId: number) => {
  const useGPT5 = process.env.USE_GPT5_ENRICHMENT;
  const searchId = await postSearch({
    targetType: 'project',
    targetId: projectId,
    startedAt: new Date()
  });
  console.log(
    `Started enrichment search ID ${searchId} for project ID ${projectId}`
  );
  if (useGPT5) {
    return enrichProjectWithGPT5(projectId);
  } else {
    return enrichProjectWithTavily(projectId);
  }
};

export const enrichProjectsBatchWithGPT5 = async (projectIds: number[]) => {
  // Run all enrichments concurrently
  const enrichmentPromises = projectIds.map(async (projectId) => {
    try {
      const result = await enrichProjectWithGPT5(projectId);
      return { success: true, ...result };
    } catch (error) {
      return {
        success: false,
        projectId,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

  const results = await Promise.all(enrichmentPromises);
  return {
    total: projectIds.length,
    successful: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
    results
  };
};

export const enrichProjectAfterFirstPassWithGPT5Batch = async (
  firstPassProjectIds: number[]
) => {
  const enrichmentPromises = firstPassProjectIds.map(
    async (firstPassProjectId) => {
      try {
        await enrichProjectAfterFirstPassWithGPT5(firstPassProjectId);
        return { success: true, firstPassProjectId };
      } catch (error) {
        return {
          success: false,
          firstPassProjectId,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }
  );

  const results = await Promise.all(enrichmentPromises);
  return {
    total: firstPassProjectIds.length,
    successful: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
    results
  };
};

// Batch enrich multiple projects
export const enrichProjectsBatch = async (projectIds: number[]) => {
  // Run all enrichments concurrently
  const enrichmentPromises = projectIds.map(async (projectId) => {
    try {
      const result = await enrichProject(projectId);
      return { success: true, ...result };
    } catch (error) {
      return {
        success: false,
        projectId,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

  const results = await Promise.all(enrichmentPromises);

  return {
    total: projectIds.length,
    successful: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
    results
  };
};
