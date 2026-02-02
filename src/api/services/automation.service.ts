import {
  parseSearchQuery,
  generateSearchQuery,
  extractProjectData,
  parseCompanyQuery,
  extractEnrichmentData
} from './open.service';
import { searchWeb, fetchPageContent } from './search.service';

import {
  checkDeveloperExistsByName,
  postDeveloper,
  putDeveloper
} from '../models/developerModel';
import {
  checkArchitectExistsByName,
  postArchitect,
  putArchitect
} from '../models/architectModel';
import {
  checkContractorExistsByName,
  postContractor,
  putContractor
} from '../models/contractorModel';
import {
  postProjectDeveloper,
  checkProjectDeveloperExists
} from '../models/projectDeveloperModel';
import {
  postProjectArchitect,
  checkProjectArchitectExists
} from '../models/projectArchitectModel';
import {
  postProjectContractor,
  checkProjectContractorExists
} from '../models/projectContractorModel';
import {
  postProjectMedia,
  checkProjectMediaExistsByUrl
} from '../models/projectMediaModel';
import { getProject, putProject } from '../models/projectModel';

import { checkCountryExistsByName } from '../models/countryModel';
import {
  postDevelopersPresence,
  checkDeveloperPresenceInCountry
} from '../models/developersPresenceModel';
import {
  postContractorsPresence,
  checkContractorPresenceInCountry
} from '../models/contractorsPresenceModel';
import {
  postArchitectsPresence,
  checkArchitectPresenceInCountry
} from '../models/architectsPresenceModel';
import {
  checkBuildingUseExistsByName,
  postBuildingUse
} from '../models/buildingUseModel';
import {
  postProjectBuildingUse,
  checkProjectBuildingUseExists
} from '../models/projectBuildingUseModel';
import {
  checkProjectWebsiteExistsByUrl,
  postProjectWebsite
} from '../models/projectWebsiteModel';
import { getAddressByProjectId, putAddress } from '../models/addressModel';
import { parseToStandardDate } from '../../utils/utilities';

import { Address } from '../../interfaces/Address';

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
  const project = await getProject(projectId);
  console.log(`Enriching project: ${project.name}`);

  try {
    // Perform web searches
    const searchQueries = [
      `"${project.name}" ${project.address?.city?.name} building height meters floors`,
      `"${project.name}" ${project.address?.city?.name} construction status`,
      `"${project.name}" developer architect contractor`,
      `"${project.name}" budget cost EUR`,
      `"${project.name}" completion date opening`
    ];

    const searchPromises = searchQueries.map((query) => searchWeb(query, 5));
    const searchResults = (await Promise.all(searchPromises)).flat();

    // Deduplicate URLs
    const uniqueUrls = new Set<string>();
    const deduplicatedResults: any[] = [];
    for (const result of searchResults) {
      if (!uniqueUrls.has(result.url)) {
        uniqueUrls.add(result.url);
        deduplicatedResults.push(result);
      }
    }

    // Fetch full content
    const pageContents = await Promise.all(
      deduplicatedResults.slice(0, 8).map(async (result) => {
        try {
          const content = await fetchPageContent(result.url);
          return { url: result.url, content, title: result.title };
        } catch (error) {
          return {
            url: result.url,
            content: result.content,
            title: result.title
          };
        }
      })
    );

    // Extract data with OpenAI
    const enrichedData = await extractEnrichmentData(
      project.name,
      project.address?.city?.name as string,
      pageContents
    );

    console.log('Enriched data:', JSON.stringify(enrichedData, null, 2));

    // Prepare updates
    const updates: any = {};
    const timeNow = new Date();

    // Update basic fields (only if empty)
    if (enrichedData.buildingHeightMeters && !project.buildingHeightMeters) {
      updates.buildingHeightMeters = enrichedData.buildingHeightMeters;
    }
    if (enrichedData.buildingHeightFloors && !project.buildingHeightFloors) {
      updates.buildingHeightFloors = enrichedData.buildingHeightFloors;
    }
    if (enrichedData.status && !project.status) {
      updates.status = enrichedData.status;
    }
    if (enrichedData.budgetEur && !project.budgetEur) {
      updates.budgetEur = enrichedData.budgetEur;
    }
    if (enrichedData.glassFacade && !project.glassFacade) {
      updates.glassFacade = enrichedData.glassFacade;
    }
    if (
      enrichedData.facadeBasis &&
      (!project.facadeBasis || project.facadeBasis === 'unknown')
    ) {
      updates.facadeBasis = enrichedData.facadeBasis;
    }

    // Parse and update dates
    if (
      enrichedData.expectedCompletion?.expected &&
      !project.expectedDateText
    ) {
      const parsed = parseToStandardDate(
        enrichedData.expectedCompletion.expected
      );
      updates.expectedDateText = enrichedData.expectedCompletion.expected;
      updates.expectedDate = parsed ? new Date(parsed) : null;
    }
    if (
      enrichedData.expectedCompletion?.earliest &&
      !project.earliestDateText
    ) {
      updates.earliestDateText = enrichedData.expectedCompletion.earliest;
    }
    if (enrichedData.expectedCompletion?.latest && !project.latestDateText) {
      updates.latestDateText = enrichedData.expectedCompletion.latest;
    }

    // Update address with coordinates
    if (enrichedData.location?.coordinates) {
      try {
        const address = await getAddressByProjectId(projectId);
        if (address) {
          const updatedAddress: Address = {
            address: enrichedData.location.address || address.address,
            location: {
              type: 'Point',
              coordinates: [
                enrichedData.location.coordinates.longitude || 0,
                enrichedData.location.coordinates.latitude || 0
              ]
            },
            postcode: address.postcode
          };
          await putAddress(updatedAddress, address.id as number);
        }
      } catch (error) {
        console.warn('Failed to update address:', error);
      }
    }

    // Get country ID for presence checks
    const countryId = await checkCountryExistsByName(
      project.country?.name as string
    );

    // Update/create developers
    const newDevelopers = [];
    if (enrichedData.developers?.length) {
      for (const dev of enrichedData.developers) {
        if (!dev.name) continue;
        try {
          let devId = await checkDeveloperExistsByName(dev.name);
          if (devId === 0) {
            devId = await postDeveloper({
              name: dev.name,
              website: dev.website || null,
              hqCountryId: countryId !== 0 ? countryId : null,
              email: dev.contact?.email || null,
              phone: dev.contact?.phone || null
            });
            const linkExists = await checkProjectDeveloperExists(
              projectId,
              devId
            );
            if (!linkExists) {
              await postProjectDeveloper({
                projectId,
                developerId: devId,
                source: dev.source
              });
            }
            if (countryId !== 0) {
              const presenceExists = await checkDeveloperPresenceInCountry(
                devId,
                countryId
              );
              if (!presenceExists) {
                await postDevelopersPresence({ developerId: devId, countryId });
              }
            }
          } else {
            // Update existing developer
            await putDeveloper(
              {
                name: dev.name,
                website: dev.website || null,
                email: dev.contact?.email || null,
                phone: dev.contact?.phone || null
              },
              devId
            );
            const linkExists = await checkProjectDeveloperExists(
              projectId,
              devId
            );
            if (!linkExists) {
              await postProjectDeveloper({
                projectId,
                developerId: devId,
                source: dev.source
              });
            }
          }
          newDevelopers.push({ id: devId, name: dev.name });
        } catch (error) {
          console.warn(`Failed to add developer ${dev.name}:`, error);
        }
      }
    }

    // Update/create architects
    const newArchitects = [];
    if (enrichedData.architects?.length) {
      for (const arch of enrichedData.architects) {
        if (!arch.name) continue;
        try {
          let archId = await checkArchitectExistsByName(arch.name);
          if (archId === 0) {
            archId = await postArchitect({
              name: arch.name,
              website: arch.website || null,
              hqCountryId: countryId !== 0 ? countryId : null,
              email: arch.contact?.email || null,
              phone: arch.contact?.phone || null
            });
            const linkExists = await checkProjectArchitectExists(
              projectId,
              archId
            );
            if (!linkExists) {
              await postProjectArchitect({
                projectId,
                architectId: archId,
                source: arch.source
              });
            }
            if (countryId !== 0) {
              const presenceExists = await checkArchitectPresenceInCountry(
                archId,
                countryId
              );
              if (!presenceExists) {
                await postArchitectsPresence({
                  architectId: archId,
                  countryId
                });
              }
            }
          } else {
            // Update existing architect
            await putArchitect(
              {
                name: arch.name,
                website: arch.website || null,
                email: arch.contact?.email || null,
                phone: arch.contact?.phone || null
              },
              archId
            );
            const linkExists = await checkProjectArchitectExists(
              projectId,
              archId
            );
            if (!linkExists) {
              await postProjectArchitect({
                projectId,
                architectId: archId,
                source: arch.source
              });
            }
          }
          newArchitects.push({ id: archId, name: arch.name });
        } catch (error) {
          console.warn(`Failed to add architect ${arch.name}:`, error);
        }
      }
    }

    // Update/create contractors
    const newContractors = [];
    if (enrichedData.contractors?.length) {
      for (const cont of enrichedData.contractors) {
        if (!cont.name) continue;
        try {
          let contId = await checkContractorExistsByName(cont.name);
          if (contId === 0) {
            contId = await postContractor({
              name: cont.name,
              website: cont.website || null,
              hqCountryId: countryId !== 0 ? countryId : null,
              email: cont.contact?.email || null,
              phone: cont.contact?.phone || null
            });
            const linkExists = await checkProjectContractorExists(
              projectId,
              contId
            );
            if (!linkExists) {
              await postProjectContractor({
                projectId,
                contractorId: contId,
                source: cont.source
              });
            }
            if (countryId !== 0) {
              const presenceExists = await checkContractorPresenceInCountry(
                contId,
                countryId
              );
              if (!presenceExists) {
                await postContractorsPresence({
                  contractorId: contId,
                  countryId
                });
              }
            }
          } else {
            // Update existing contractor
            await putContractor(
              {
                name: cont.name,
                website: cont.website || null,
                email: cont.contact?.email || null,
                phone: cont.contact?.phone || null
              },
              contId
            );
            const linkExists = await checkProjectContractorExists(
              projectId,
              contId
            );
            if (!linkExists) {
              await postProjectContractor({
                projectId,
                contractorId: contId,
                source: cont.source
              });
            }
          }
          newContractors.push({ id: contId, name: cont.name });
        } catch (error) {
          console.warn(`Failed to add contractor ${cont.name}:`, error);
        }
      }
    }

    // Update building uses
    if (enrichedData.buildingUse?.length) {
      for (const bu of enrichedData.buildingUse) {
        try {
          const buildingUseId = await checkBuildingUseExistsByName(bu);
          let finalBuId = buildingUseId;
          if (buildingUseId === 0) {
            finalBuId = await postBuildingUse({ buildingUse: bu });
          }
          if (finalBuId !== 0) {
            const buExists = await checkProjectBuildingUseExists(
              projectId,
              finalBuId
            );
            if (!buExists) {
              await postProjectBuildingUse({
                projectId,
                buildingUseId: finalBuId
              });
            }
          }
        } catch (error) {
          console.warn(`Failed to add building use ${bu}:`, error);
        }
      }
    }

    // Update media
    const newMedia = [];
    if (enrichedData.media?.length) {
      for (const med of enrichedData.media) {
        if (!med.url) continue;
        try {
          const mediaExists = await checkProjectMediaExistsByUrl(med.url);
          if (!mediaExists) {
            const mediaId = await postProjectMedia({
              projectId,
              mediaType: med.mediaType || 'other',
              url: med.url,
              title: med.title || null
            });
            newMedia.push({ id: mediaId, url: med.url });
          }
        } catch (error) {
          console.warn(`Failed to add media ${med.url}:`, error);
        }
      }
    }

    // Update project websites
    if (enrichedData.projectWebsites?.length) {
      for (const website of enrichedData.projectWebsites) {
        try {
          const websiteExists = await checkProjectWebsiteExistsByUrl(website);
          if (!websiteExists) {
            await postProjectWebsite({ projectId, url: website });
          }
        } catch (error) {
          console.warn(`Failed to add website ${website}:`, error);
        }
      }
    }

    // Update project
    updates.lastVerifiedDate = timeNow;
    if (Object.keys(updates).length > 0) {
      await putProject(updates, projectId);
    }

    return {
      projectId,
      projectName: project.name,
      fieldsUpdated: Object.keys(updates),
      newDevelopers: newDevelopers.length,
      newArchitects: newArchitects.length,
      newContractors: newContractors.length,
      newMedia: newMedia.length,
      sourcesChecked: deduplicatedResults.length,
      updates
    };
  } catch (error) {
    console.error(`Error enriching project ${projectId}:`, error);
    throw error;
  }
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
