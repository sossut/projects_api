import {
  parseSearchQuery,
  generateSearchQuery,
  extractProjectData,
  parseCompanyQuery,
  extractEnrichmentData,
  openAIWebSearch
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
import { parseToStandardDate, toCamel } from '../../utils/utilities';

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

// Enrich a single project with additional details using Tavily (backup method)
export const enrichProjectWithTavily = async (projectId: number) => {
  const project = toCamel(await getProject(projectId));
  console.log(`Enriching project with Tavily: ${project.name}`);

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

// Enrich a single project with additional details using GPT-5 web search
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

    //     const testEnrichedText = `
    //      {
    //   "id": 2,
    //   "name": "Biltmore Residences Sufouh",
    //   "alternateNames": [
    //     "Biltmore Sufouh Residence",
    //     "The Biltmore Residences Sufouh"
    //   ],
    //   "buildingHeightMeters": 198.1,
    //   "buildingHeightFloors": 45,
    //   "floorCountMarketed": 44,
    //   "location": {
    //     "address": "Sheikh Zayed Road, Al Sufouh 1 (near Mashreq/InsuranceMarket Metro Station)",
    //     "city": "Dubai",
    //     "country": "United Arab Emirates",
    //     "metroArea": "Dubai",
    //     "postcode": null,
    //     "coordinates": {
    //       "latitude": 25.12254,
    //       "longitude": 55.18317
    //     },
    //     "plotNumber": "B-001-014 / 3720562"
    //   },
    //   "expectedCompletionWindow": {
    //     "expected": "2026-Q1",
    //     "earliest": "2025-Q4",
    //     "latest": "2026-Q2"
    //   },
    //   "buildingType": "High-rise",
    //   "buildingUse": [
    //     {
    //       "buildingUse": "residential"
    //     },
    //     {
    //       "buildingUse": "serviced_apartments"
    //     },
    //     {
    //       "buildingUse": "branded_residences"
    //     }
    //   ],
    //   "units": 480,
    //   "unitMix": "1–3 BR apartments, 4 BR options in some listings, plus Atmosphere Collection penthouses on top 6 floors",
    //   "glassFacade": "yes",
    //   "facadeBasis": "official renderings and construction/industry listings",
    //   "status": "under_construction",
    //   "construction": {
    //     "startYear": 2022,
    //     "toppedOut": null
    //   },
    //   "lastVerifiedDate": "2026-02-04T00:00:00.000Z",
    //   "confidenceScore": "High",
    //   "isActive": true,
    //   "branding": {
    //     "brand": "Biltmore Hotels & Residences",
    //     "operator": "Millennium Hotels & Resorts MEA"
    //   },
    //   "amenities": [
    //     "Olympic-size pool",
    //     "Kids pool",
    //     "Jacuzzi",
    //     "Gym",
    //     "Health club",
    //     "Business center",
    //     "Padel/tennis courts",
    //     "Zen Garden",
    //     "Concierge/valet",
    //     "Retail"
    //   ],
    //   "projectWebsites": [
    //     {
    //       "id": 1,
    //       "url": "https://biltmoresufouh.ae/"
    //     },
    //     {
    //       "id": 2,
    //       "url": "https://www.biltmore-sufouh.com/"
    //     },
    //     {
    //       "id": 3,
    //       "url": "https://biltmore-residences.com/"
    //     },
    //     {
    //       "id": 4,
    //       "url": "https://the-biltmore-residences.com/"
    //     }
    //   ],
    //   "developers": [
    //     {
    //       "name": "GJ Properties Investments L.L.C.",
    //       "website": "https://gjproperties.ae/",
    //       "source": "industry listings and press",
    //       "contact": {
    //         "phone": "+971 6 741 4478",
    //         "email": "info@gjproperties.ae"
    //       }
    //     }
    //   ],
    //   "architects": [
    //     {
    //       "name": "Canadian Engineering Consultant",
    //       "role": "Design Architect",
    //       "website": "https://www.canadian-consultants.com/",
    //       "source": "industry database",
    //       "contact": {
    //         "phone": "+971 4 332 1006",
    //         "email": "info@canadianconsultant.net"
    //       }
    //     },
    //     {
    //       "name": "Gary Greene Design",
    //       "role": "Interior Design",
    //       "website": "https://www.garygreenedesign.com/",
    //       "source": "firm website",
    //       "contact": {
    //         "phone": "",
    //         "email": ""
    //       }
    //     }
    //   ],
    //   "contractors": [
    //     {
    //       "name": "Gulf Asia Contracting Company LLC",
    //       "role": "Main Contractor",
    //       "source": "industry database",
    //       "website": "http://www.gactme.com/",
    //       "contact": {
    //         "phone": "+971 4 438 9580",
    //         "email": "info@gactme.com"
    //       }
    //     },
    //     {
    //       "name": "Gulf Engineering & Consultants",
    //       "role": "Structural Engineer (Design)",
    //       "source": "industry database",
    //       "website": "https://gulfeng.net/",
    //       "contact": {
    //         "phone": "+971 4 221 4524",
    //         "email": "gulfeng@eim.ae"
    //       }
    //     },
    //     {
    //       "name": "AX Capital",
    //       "role": "Sales and Marketing Partner",
    //       "source": "press releases",
    //       "website": "https://www.axc.ae/",
    //       "contact": {
    //         "phone": "",
    //         "email": ""
    //       }
    //     }
    //   ],
    //   "media": [
    //     {
    //       "id": 1,
    //       "mediaType": "image",
    //       "url": "https://biltmoresufouh.ae/files/video/new-video/new/poster/fly-end.jpg",
    //       "title": "Exterior rendering - aerial",
    //       "filename": "fly-end.jpg",
    //       "sourcePage": "https://biltmoresufouh.ae/"
    //     },
    //     {
    //       "id": 2,
    //       "mediaType": "image",
    //       "url": "https://biltmoresufouh.ae/files/video/new-video/new/poster/floorplan-end2.jpg",
    //       "title": "Tower rendering",
    //       "filename": "floorplan-end2.jpg",
    //       "sourcePage": "https://biltmoresufouh.ae/"
    //     },
    //     {
    //       "id": 3,
    //       "mediaType": "image",
    //       "url": "https://biltmoresufouh.ae/img/new-img/gallery/bedroom-6.jpg",
    //       "title": "Interior - bedroom",
    //       "filename": "bedroom-6.jpg",
    //       "sourcePage": "https://biltmoresufouh.ae/"
    //     },
    //     {
    //       "id": 4,
    //       "mediaType": "image",
    //       "url": "https://biltmoresufouh.ae/img/new-img/gallery/signature---living--2.jpg",
    //       "title": "Interior - living area",
    //       "filename": "signature---living--2.jpg",
    //       "sourcePage": "https://biltmoresufouh.ae/"
    //     },
    //     {
    //       "id": 5,
    //       "mediaType": "image",
    //       "url": "https://biltmoresufouh.ae/img/new-img/gallery/2-Bedroom-typ-master-bed--1.jpg",
    //       "title": "Interior - master bedroom",
    //       "filename": "2-Bedroom-typ-master-bed--1.jpg",
    //       "sourcePage": "https://biltmoresufouh.ae/"
    //     }
    //   ],
    //   "sources": [
    //     {
    //       "id": 2,
    //       "url": "https://skyscraperpage.com/cities/?buildingID=71071",
    //       "sourceType": "database",
    //       "publisher": "SkyscraperPage",
    //       "accessedAt": "2026-01-27"
    //     },
    //     {
    //       "id": 3,
    //       "url": "https://www.skyscrapercenter.com/building/biltmore-sufouh-residence/46397",
    //       "sourceType": "database",
    //       "publisher": "CTBUH / The Skyscraper Center",
    //       "accessedAt": "2026-02-04"
    //     },
    //     {
    //       "id": 4,
    //       "url": "https://www.zawya.com/en/press-release/companies-news/millennium-hotels-and-resorts-mea-signs-agreement-for-the-biltmore-residences-in-dubai-ugb3sc4i",
    //       "sourceType": "press_release",
    //       "publisher": "Zawya",
    //       "accessedAt": "2026-02-04"
    //     },
    //     {
    //       "id": 5,
    //       "url": "https://www.hoteliermiddleeast.com/business/millennium-hotels-announces-480-unit-branded-residences-development",
    //       "sourceType": "news",
    //       "publisher": "Hotelier Middle East",
    //       "accessedAt": "2026-02-04"
    //     },
    //     {
    //       "id": 6,
    //       "url": "https://www.constructionweekonline.com/news/ajman-gj-properties-biltmore-residences-sufouh",
    //       "sourceType": "news",
    //       "publisher": "Construction Week Online",
    //       "accessedAt": "2026-02-04"
    //     },
    //     {
    //       "id": 7,
    //       "url": "https://elevatorworld.com/news/daily-news/new-dubai-boutique-property-to-open-in-2025/",
    //       "sourceType": "news",
    //       "publisher": "Elevator World",
    //       "accessedAt": "2026-02-04"
    //     }
    //   ]
    // }

    // `;

    // Single GPT-5 web search call
    const enrichedText = await openAIWebSearch(formattedProject);
    const enrichedData = JSON.parse(enrichedText.output_text || '{}');
    // const enrichedData = JSON.parse(testEnrichedText);
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
          const buildingUseId = await checkBuildingUseExistsByName(
            bu.buildingUse
          );
          let finalBuId = buildingUseId;
          if (buildingUseId === 0) {
            finalBuId = await postBuildingUse({ buildingUse: bu.buildingUse });
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
          const websiteExists = await checkProjectWebsiteExistsByUrl(
            website.url
          );
          if (!websiteExists) {
            await postProjectWebsite({ projectId, url: website.url });
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

// Main enrichment function - switches between GPT-5 and Tavily based on config
export const enrichProject = async (projectId: number) => {
  const useGPT5 = process.env.USE_GPT5_ENRICHMENT === 'true';

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
