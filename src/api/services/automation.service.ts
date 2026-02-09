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
import {
  checkIfProjectExistsByKey,
  getProject,
  postProject,
  putProject
} from '../models/projectModel';

import { checkCountryExistsByName, postCountry } from '../models/countryModel';
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
import {
  getAddressByProjectId,
  postAddress,
  putAddress
} from '../models/addressModel';
import { parseToStandardDate, toCamel } from '../../utils/utilities';
import { enrichProjectWithTavily } from './enrichmentTavily.service';
import { Address } from '../../interfaces/Address';
import {
  getProjectFirstPass,
  postProjectFirstPass
} from '../models/projectFirstPassModel';
import { postSearch } from '../models/searchModel';
import CustomError from '../../classes/CustomError';
import {
  checkContinentExistsByName,
  postContinent
} from '../models/continentModel';
import {
  checkMetroAreaExistsByName,
  postMetroArea
} from '../models/metroAreaModel';
import { checkCityExistsByName, postCity } from '../models/cityModel';
import {
  checkBuildingTypeExistsByName,
  postBuildingType
} from '../models/buildingTypeModel';
import { Project } from '../../interfaces/Project';
import { ProjectBuildingUse } from '../../interfaces/ProjectBuildingUse';
import { Developer } from '../../interfaces/Developer';
import { Architect } from '../../interfaces/Architect';
import { Contractor } from '../../interfaces/Contractor';

import { postSourceLink } from '../models/sourceLinkModel';

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
    if (enrichedData.isActive !== undefined || project.isActive === null) {
      updates.isActive = enrichedData.isActive;
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
              newDevelopers.push({ id: devId, name: dev.name });
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
              newDevelopers.push({ id: devId, name: dev.name });
            }
          }
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
              newArchitects.push({ id: archId, name: arch.name });
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
              newArchitects.push({ id: archId, name: arch.name });
            }
          }
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
              newContractors.push({ id: contId, name: cont.name });
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
              newContractors.push({ id: contId, name: cont.name });
            }
          }
        } catch (error) {
          console.warn(`Failed to add contractor ${cont.name}:`, error);
        }
      }
    }

    // Update building uses
    if (enrichedData.buildingUse?.length) {
      for (const bu of enrichedData.buildingUse) {
        try {
          console.log({ bu });
          const buildingUseId = await checkBuildingUseExistsByName(bu);
          let finalBuId = buildingUseId;
          console.log({ buildingUseId });
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
      updates
    };
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
    const timeNow = new Date(Date.now());
    if (!enrichedData.name) {
      throw new CustomError(
        'Enriched data is missing required field (name)',
        400
      );
    }
    const pK = (enrichedData.name.trim().toLowerCase() +
      '|' +
      enrichedData.location.city.trim().toLowerCase() +
      '|' +
      enrichedData.location.country.trim().toLowerCase()) as string;
    const checkProjectKey = await checkIfProjectExistsByKey(pK);
    if (checkProjectKey) {
      throw new CustomError(
        `Project with key ${pK} already exists in main project table, cannot enrich first pass project ${firstPassProjectId}`,
        400
      );
    }
    if (!enrichedData.location) {
      throw new CustomError(
        'Enriched data is missing required field (location)',
        400
      );
    }
    const continentExists = await checkContinentExistsByName(
      enrichedData.location.continent
    );
    let continentId = continentExists;
    if (continentExists === 0) {
      continentId = await postContinent({
        name: enrichedData.location.continent,
        code: null
      });
    }
    if (continentId === 0) {
      throw new CustomError(
        `Failed to find or create continent ${enrichedData.location.continent} for first pass project ${firstPassProjectId}`,
        500
      );
    }
    const countryExists = await checkCountryExistsByName(
      enrichedData.location.country
    );
    let countryId = countryExists;
    if (countryExists === 0) {
      countryId = await postCountry({
        name: enrichedData.location.country,
        code: null,
        continentId
      });
    }
    if (countryId === 0) {
      throw new CustomError(
        `Failed to find or create country ${enrichedData.location.country} for first pass project ${firstPassProjectId}`,
        500
      );
    }
    enrichedData.lastVerifiedDate = timeNow;
    const metroAreaExists = await checkMetroAreaExistsByName(
      enrichedData.location.metroArea
    );
    let metroAreaId = metroAreaExists;
    if (metroAreaExists === 0) {
      metroAreaId = await postMetroArea({
        name: enrichedData.location.metroArea,
        countryId: countryId,
        lastSearchedAt: timeNow
      });
    }
    if (metroAreaId === 0) {
      throw new CustomError(
        `Failed to find or create metro area ${enrichedData.location.metroArea} for first pass project ${firstPassProjectId}`,
        500
      );
    }
    const cityExists = await checkCityExistsByName(enrichedData.location.city);
    let cityId = cityExists;

    if (cityExists === 0) {
      cityId = await postCity({
        name: enrichedData.location.city,
        metroAreaId
      });
    }
    if (cityId === 0) {
      throw new CustomError('Failed to create city', 500);
    }
    const address: Address = {
      address: enrichedData.location.address,
      location: {
        type: 'Point',
        coordinates: [
          enrichedData.location.coordinates?.longitude || 0,
          enrichedData.location.coordinates?.latitude || 0
        ]
      },
      postcode: enrichedData.location.postcode,
      cityId: cityId
    };
    const addressId = await postAddress(address);
    if (!addressId) {
      throw new CustomError('Failed to create address', 500);
    }
    const buildingTypeExists = await checkBuildingTypeExistsByName(
      enrichedData.buildingType
    );
    let buildingTypeId = buildingTypeExists;
    if (buildingTypeExists === 0) {
      buildingTypeId = await postBuildingType({
        buildingType: enrichedData.buildingType
      });
    }
    if (enrichedData.glassFacade === 'null') {
      enrichedData.glassFacade = null;
    }
    const expectedDate = parseToStandardDate(
      enrichedData.expectedCompletion?.expected || ''
    );

    const project: Project = {
      name: enrichedData.name,
      expectedDateText:
        (enrichedData.expectedCompletionWindow?.expected as string)?.slice(
          0,
          100
        ) || null,
      earliestDateText:
        (enrichedData.expectedCompletionWindow?.earliest as string)?.slice(
          0,
          100
        ) || null,
      latestDateText:
        (enrichedData.expectedCompletionWindow?.latest as string)?.slice(
          0,
          100
        ) || null,
      expectedDate: new Date(expectedDate || ''),
      addressId: addressId,
      buildingTypeId: buildingTypeId,
      status: enrichedData.status,
      budgetEur: enrichedData.budgetEur,
      glassFacade: enrichedData.glassFacade,
      facadeBasis: enrichedData.facadeBasis,
      lastVerifiedDate: enrichedData.lastVerifiedDate,
      confidenceScore: enrichedData.confidenceScore,
      isActive: enrichedData.isActive,
      projectKey: (enrichedData.name.trim().toLowerCase() +
        '|' +
        enrichedData.location.city.trim().toLowerCase() +
        '|' +
        enrichedData.location.country.trim().toLowerCase()) as string,
      buildingHeightMeters: enrichedData.buildingHeightMeters,
      buildingHeightFloors: enrichedData.buildingHeightFloors
    };
    console.log(project);
    const projectId = await postProject(project);
    if (!projectId) {
      throw new CustomError('Failed to create project', 500);
    }
    for (const url of enrichedData.projectWebsites || []) {
      await postProjectWebsite({ projectId, url });
    }
    for (const media of enrichedData.media || []) {
      await postProjectMedia({
        projectId,
        mediaType: media.mediaType || 'other',
        url: media.url,
        title: media.title || null,
        filename: media.filename || null,
        sourcePage: media.sourcePage || null
      });
    }
    for (const bu of enrichedData.buildingUse || []) {
      const buildingUseExists = await checkBuildingUseExistsByName(bu);
      let buildingUseId = buildingUseExists;
      if (buildingUseExists === 0) {
        buildingUseId = await postBuildingUse({ buildingUse: bu });
      }
      if (buildingUseId === 0) {
        throw new CustomError('Failed to create building use', 500);
      }
      const projectBuildingUse: ProjectBuildingUse = {
        projectId: projectId,
        buildingUseId: buildingUseId
      };
      await postProjectBuildingUse(projectBuildingUse);
    }
    for (const developer of enrichedData.developers || []) {
      const developerExists = await checkDeveloperExistsByName(developer.name);
      let developerId = developerExists;
      if (developerExists === 0) {
        const d: Developer = {
          name: developer.name,
          website: developer.website,
          hqCountryId: null,
          email: developer.contact?.email,
          phone: developer.contact?.phone
        };
        developerId = await postDeveloper(d);
      }
      if (developerId === 0) {
        throw new CustomError('Failed to create developer', 500);
      }
      await postProjectDeveloper({
        projectId: projectId,
        developerId: developerId,
        source: developer.source as string
      });
      if (countryId !== 0) {
        const developerPresenceExists = await checkDeveloperPresenceInCountry(
          developerId,
          countryId
        );
        if (!developerPresenceExists) {
          await postDevelopersPresence({
            developerId: developerId,
            countryId: countryId
          });
        }
      }
    }
    for (const architect of enrichedData.architects || []) {
      const architectExists = await checkArchitectExistsByName(architect.name);
      let architectId = architectExists;
      if (architectExists === 0) {
        const a: Architect = {
          name: architect.name,
          website: architect.website,
          hqCountryId: null,
          email: architect.contact?.email,
          phone: architect.contact?.phone
        };
        architectId = await postArchitect(a);
      }
      if (architectId === 0) {
        throw new CustomError('Failed to create architect', 500);
      }
      await postProjectArchitect({
        projectId: projectId,
        architectId: architectId,
        source: architect.source as string
      });
      if (countryId !== 0) {
        const architectPresenceExists = await checkArchitectPresenceInCountry(
          architectId,
          countryId
        );
        if (!architectPresenceExists) {
          await postArchitectsPresence({
            architectId: architectId,
            countryId: countryId
          });
        }
      }
    }
    for (const contractor of enrichedData.contractors || []) {
      const contractorExists = await checkContractorExistsByName(
        contractor.name
      );
      let contractorId = contractorExists;
      if (contractorExists === 0) {
        const c: Contractor = {
          name: contractor.name,
          website: contractor.website,
          hqCountryId: null,
          email: contractor.contact?.email,
          phone: contractor.contact?.phone
        };
        contractorId = await postContractor(c);
      }
      if (contractorId === 0) {
        throw new CustomError('Failed to create contractor', 500);
      }
      await postProjectContractor({
        projectId: projectId,
        contractorId: contractorId,
        source: contractor.source as string
      });
      if (countryId !== 0) {
        const contractorPresenceExists = await checkContractorPresenceInCountry(
          contractorId,
          countryId
        );
        if (!contractorPresenceExists) {
          await postContractorsPresence({
            contractorId: contractorId,
            countryId: countryId
          });
        }
      }
    }

    for (const source of enrichedData.sources || []) {
      console.log(source);
      await postSourceLink({
        projectId: projectId,
        url: source.url,
        sourceType: source.sourceType,
        publisher: source.publisher,
        accessedAt: source.accessedAt
      });
    }
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
