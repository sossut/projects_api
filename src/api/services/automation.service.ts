import {
  parseSearchQuery,
  generateSearchQuery,
  extractProjectData,
  parseCompanyQuery,
  extractEnrichmentData
} from './open.service';
import { searchWeb, fetchPageContent } from './search.service';
import { postProject } from '../models/projectModel';
import {
  checkDeveloperExistsByName,
  postDeveloper
} from '../models/developerModel';
import {
  checkArchitectExistsByName,
  postArchitect
} from '../models/architectModel';
import {
  checkContractorExistsByName,
  postContractor
} from '../models/contractorModel';
import { postProjectDeveloper } from '../models/projectDeveloper';
import { postProjectArchitect } from '../models/projectArchitect';
import { postProjectContractor } from '../models/projectContractor';
import { getProject, putProject } from '../models/projectModel';
import { Project } from '../../interfaces/Project';

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

// Enrich a single project with additional details
export const enrichProject = async (projectId: number) => {
  // Get existing project
  const project = await getProject(projectId);

  console.log(`Enriching project: ${project.name}`);

  const updates: any = {};
  const searchResults: any[] = [];

  try {
    // Search 1: Official project website
    const websiteSearch = await searchWeb(
      `${project.name} ${project.address?.city?.name} official website`,
      5
    );
    searchResults.push(...websiteSearch);

    // Search 2: Building specifications
    const specsSearch = await searchWeb(
      `${project.name} ${project.address?.city?.name} height meters floors specifications`,
      5
    );
    searchResults.push(...specsSearch);

    // Search 3: Latest news and status
    const statusSearch = await searchWeb(
      `${project.name} ${project.address?.city?.name} construction status 2026`,
      5
    );
    searchResults.push(...statusSearch);

    // Search 4: Developer and architect info
    const companiesSearch = await searchWeb(
      `${project.name} developer architect contractor`,
      5
    );
    searchResults.push(...companiesSearch);

    // Combine all search results
    const allContent = await Promise.all(
      searchResults.slice(0, 10).map(async (result) => {
        const content = await fetchPageContent(result.url);
        return { url: result.url, content };
      })
    );

    // Use OpenAI to extract enrichment data
    const enrichedData = await extractEnrichmentData(
      project.name,
      project.address?.city?.name as string,
      allContent
    );

    // Build updates object
    if (enrichedData.buildingHeightMeters && !project.buildingHeightMeters) {
      updates.buildingHeightMeters = enrichedData.buildingHeightMeters;
    }

    if (enrichedData.buildingHeightFloors && !project.buildingHeightFloors) {
      updates.buildingHeightFloors = enrichedData.buildingHeightFloors;
    }

    if (enrichedData.status) {
      updates.status = enrichedData.status;
    }

    if (enrichedData.budgetEur && !project.budgetEur) {
      updates.budgetEur = enrichedData.budgetEur;
    }

    if (enrichedData.glassFacade && !project.glassFacade) {
      updates.glassFacade = enrichedData.glassFacade;
    }

    if (enrichedData.expectedCompletion) {
      updates.expectedDateText = enrichedData.expectedCompletion.expected;
      updates.earliestDateText = enrichedData.expectedCompletion.earliest;
      updates.latestDateText = enrichedData.expectedCompletion.latest;
    }

    // Update developers
    const newDevelopers = [];
    for (const dev of enrichedData.developers || []) {
      let devId = await checkDeveloperExistsByName(dev.name);
      if (devId === 0) {
        devId = await postDeveloper({
          name: dev.name,
          website: dev.website || null,
          hqCountryId: null,
          email: dev.contact?.email || null,
          phone: dev.contact?.phone || null
        });
      }
      newDevelopers.push({ id: devId, name: dev.name });
      await postProjectDeveloper({ projectId, developerId: devId });
    }

    // Update architects
    const newArchitects = [];
    for (const arch of enrichedData.architects || []) {
      let archId = await checkArchitectExistsByName(arch.name);
      if (archId === 0) {
        archId = await postArchitect({
          name: arch.name,
          website: arch.website || null,
          hqCountryId: null,
          email: arch.contact?.email || null,
          phone: arch.contact?.phone || null
        });
      }
      newArchitects.push({ id: archId, name: arch.name });
      await postProjectArchitect({ projectId, architectId: archId });
    }

    // Update contractors
    const newContractors = [];
    for (const cont of enrichedData.contractors || []) {
      let contId = await checkContractorExistsByName(cont.name);
      if (contId === 0) {
        contId = await postContractor({
          name: cont.name,
          website: cont.website || null,
          hqCountryId: null,
          email: cont.contact?.email || null,
          phone: cont.contact?.phone || null
        });
      }
      newContractors.push({ id: contId, name: cont.name });
      await postProjectContractor({ projectId, contractorId: contId });
    }

    // Update project if we have changes
    if (Object.keys(updates).length > 0) {
      updates.lastVerifiedDate = new Date();
      await putProject({ ...project, ...updates }, projectId);
    }

    return {
      projectId,
      projectName: project.name,
      fieldsUpdated: Object.keys(updates),
      newDevelopers: newDevelopers.length,
      newArchitects: newArchitects.length,
      newContractors: newContractors.length,
      sourcesChecked: searchResults.length,
      updates
    };
  } catch (error) {
    console.error(`Error enriching project ${projectId}:`, error);
    throw error;
  }
};

// Batch enrich multiple projects
export const enrichProjectsBatch = async (projectIds: number[]) => {
  const results = [];

  for (const projectId of projectIds) {
    try {
      const result = await enrichProject(projectId);
      results.push({ success: true, ...result });
    } catch (error) {
      results.push({
        success: false,
        projectId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return {
    total: projectIds.length,
    successful: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
    results
  };
};
