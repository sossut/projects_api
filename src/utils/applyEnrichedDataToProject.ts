import { postProjectAudit } from '../api/models/projectAuditModel';
import {
  getAddressByProjectId,
  postAddress,
  putAddress
} from '../api/models/addressModel';
import {
  checkArchitectExistsByName,
  postArchitect,
  putArchitect
} from '../api/models/architectModel';
import {
  checkArchitectPresenceInCountry,
  postArchitectsPresence
} from '../api/models/architectsPresenceModel';
import {
  checkBuildingUseExistsByName,
  postBuildingUse
} from '../api/models/buildingUseModel';
import {
  checkContractorExistsByName,
  postContractor,
  putContractor
} from '../api/models/contractorModel';
import {
  checkContractorPresenceInCountry,
  postContractorsPresence
} from '../api/models/contractorsPresenceModel';
import {
  checkCountryExistsByName,
  postCountry
} from '../api/models/countryModel';
import {
  checkContinentExistsByName,
  postContinent
} from '../api/models/continentModel';
import { postMetroArea } from '../api/models/metroAreaModel';
import { checkCityExistsByName, postCity } from '../api/models/cityModel';
import {
  checkDeveloperExistsByName,
  postDeveloper,
  putDeveloper
} from '../api/models/developerModel';
import {
  checkDeveloperPresenceInCountry,
  postDevelopersPresence
} from '../api/models/developersPresenceModel';
import {
  checkProjectArchitectExists,
  postProjectArchitect
} from '../api/models/projectArchitectModel';
import {
  checkProjectBuildingUseExists,
  postProjectBuildingUse
} from '../api/models/projectBuildingUseModel';
import {
  checkProjectContractorExists,
  postProjectContractor
} from '../api/models/projectContractorModel';
import {
  checkProjectDeveloperExists,
  postProjectDeveloper
} from '../api/models/projectDeveloperModel';
import {
  checkProjectMediaExistsByUrl,
  postProjectMedia
} from '../api/models/projectMediaModel';
import {
  checkIfProjectExistsByKey,
  postProject,
  putProject
} from '../api/models/projectModel';
import {
  checkProjectWebsiteExistsByUrl,
  postProjectWebsite
} from '../api/models/projectWebsiteModel';
import { Address } from '../interfaces/Address';
import { findMetroAreaIdByName, parseToStandardDate } from './utilities';
import CustomError from '../classes/CustomError';
import { Continent } from '../interfaces/Continent';
import { Country } from '../interfaces/Country';
import { MetroArea } from '../interfaces/MetroArea';
import { City } from '../interfaces/City';
import {
  checkBuildingTypeExistsByName,
  postBuildingType
} from '../api/models/buildingTypeModel';
import { BuildingType } from '../interfaces/BuildingType';
import { Project } from '../interfaces/Project';
import { ProjectBuildingUse } from '../interfaces/ProjectBuildingUse';
import { Developer } from '../interfaces/Developer';
import { Architect } from '../interfaces/Architect';
import { Contractor } from '../interfaces/Contractor';
import { ProjectMedia } from '../interfaces/ProjectMedia';
import { postSourceLink } from '../api/models/sourceLinkModel';
import {
  checkConsultantExistsByName,
  postConsultant,
  putConsultant
} from '../api/models/consultantModel';
import {
  checkProjectConsultantExists,
  postProjectConsultant
} from '../api/models/projectConstultantModel';
import {
  checkConsultantsPresenceExists,
  postConsultantsPresence
} from '../api/models/consultantsPresenceModel';
import { Consultant } from '../interfaces/Consultant';

const applyEnrichedDataToProject = async (
  projectId: number,
  project: any,
  enrichedData: any
) => {
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
  if (enrichedData.expectedCompletion?.expected && !project.expectedDateText) {
    const parsed = parseToStandardDate(
      enrichedData.expectedCompletion.expected
    );
    updates.expectedDateText = enrichedData.expectedCompletion.expected;
    updates.expectedDate = parsed ? new Date(parsed) : null;
  }
  if (enrichedData.expectedCompletion?.earliest && !project.earliestDateText) {
    updates.earliestDateText = enrichedData.expectedCompletion.earliest;
  }
  if (enrichedData.expectedCompletion?.latest && !project.latestDateText) {
    updates.latestDateText = enrichedData.expectedCompletion.latest;
  }

  // Update address if new address or coordinates are present
  if (enrichedData.location?.address || enrichedData.location?.coordinates) {
    try {
      const address = await getAddressByProjectId(projectId);
      if (address) {
        const updatedAddress: Address = {
          address: enrichedData.location.address || address.address,
          location: address.location,
          postcode: address.postcode
        };
        // Only update coordinates if provided
        if (enrichedData.location.coordinates) {
          updatedAddress.location = {
            type: 'Point',
            coordinates: [
              enrichedData.location.coordinates.longitude || 0,
              enrichedData.location.coordinates.latitude || 0
            ]
          };
        }
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
  //Update consultants
  const newConsultants = [];
  if (enrichedData.consultants?.length) {
    for (const cons of enrichedData.consultants) {
      if (!cons.name) continue;
      try {
        let consId = await checkConsultantExistsByName(cons.name);
        if (consId === 0) {
          consId = await postConsultant({
            name: cons.name,
            website: cons.website || null,
            hqCountryId: countryId !== 0 ? countryId : null,
            email: cons.contact?.email || null,
            phone: cons.contact?.phone || null
          });
          const linkExists = await checkProjectConsultantExists(
            projectId,
            consId
          );
          if (!linkExists) {
            await postProjectConsultant({
              projectId,
              consultantId: consId,
              source: cons.source
            });
            newConsultants.push({ id: consId, name: cons.name });
          }
          if (countryId !== 0) {
            const presenceExists = await checkConsultantsPresenceExists(
              consId as number,
              countryId
            );
            if (!presenceExists) {
              await postConsultantsPresence({
                consultantId: consId as number,
                countryId
              });
            }
          }
        } else {
          // Update existing consultant
          await putConsultant(
            {
              name: cons.name,
              website: cons.website || null,
              email: cons.contact?.email || null,
              phone: cons.contact?.phone || null
            },
            consId as number
          );
          const linkExists = await checkProjectConsultantExists(
            projectId,
            consId as number
          );
          if (!linkExists) {
            await postProjectConsultant({
              projectId,
              consultantId: consId as number,
              source: cons.source
            });
            newConsultants.push({ id: consId, name: cons.name });
          }
        }
      } catch (error) {
        console.warn(`Failed to add consultant ${cons.name}:`, error);
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
  let updated = false;
  if (Object.keys(updates).length > 0) {
    await putProject(updates, projectId);
    updated = true;
  }

  // Log project enrichment in project audits
  try {
    await postProjectAudit({
      projectId,
      searchId: null,
      fieldName: 'project.enriched',
      oldValue: null,
      newValue: JSON.stringify(enrichedData),
      changeType: 'automated',
      changedBy: null
    });
  } catch (err) {
    console.warn('Failed to log project enrichment audit:', err);
  }

  return {
    projectId,
    projectName: project.name,
    fieldsUpdated: Object.keys(updates),
    newDevelopers: newDevelopers.length,
    newArchitects: newArchitects.length,
    newContractors: newContractors.length,
    newMedia: newMedia.length,
    updates,
    auditLogged: true,
    updated
  };
};

const addNewProjectToDB = async (proj: any, changeType?: string) => {
  try {
    if (!proj.name || !proj.location) {
      throw new CustomError('Project name and location are required', 400);
    }
    const pK = (proj.name.trim().toLowerCase() +
      '|' +
      proj.location.city.trim().toLowerCase() +
      '|' +
      proj.location.country.trim().toLowerCase()) as string;

    const checkProjectKey = await checkIfProjectExistsByKey(pK);
    if (checkProjectKey) {
      throw new CustomError(
        'Project with same name and location already exists',
        400
      );
    }

    // const user = req.user as User;
    // if (user.role !== 'admin') {
    //   throw new CustomError('Unauthorized', 401);
    // }

    if (!proj.location) {
      throw new CustomError('Location is required', 400);
    }
    const continentExists = await checkContinentExistsByName(
      proj.location.continent
    );
    let continentID = continentExists;
    const continent: Continent = {
      name: proj.location.continent as string,
      code: null
    };
    if (continentExists === 0) {
      continentID = await postContinent(continent);
    }
    if (continentID === 0) {
      throw new CustomError('Failed to create continent', 500);
    }

    const countryExists = await checkCountryExistsByName(proj.location.country);
    let countryID = countryExists;
    const country: Country = {
      name: proj.location.country as string,
      code: null,
      continentId: continentID
    };

    if (countryExists === 0) {
      countryID = await postCountry(country);
    }

    if (countryID === 0) {
      throw new CustomError('Failed to create country', 500);
    }
    const timeNow = new Date(Date.now());
    proj.lastVerifiedDate = timeNow;
    const metroArea: MetroArea = {
      name: proj.location.metroArea,
      countryId: countryID,
      lastSearchedAt: timeNow
    };
    let metroAreaId = await findMetroAreaIdByName(proj.location.metroArea);

    if (!metroAreaId) {
      metroAreaId = await postMetroArea(metroArea);
    }

    if (!metroAreaId) {
      throw new CustomError('Failed to create metro area', 500);
    }

    const cityExists = await checkCityExistsByName(proj.location.city);
    let cityId = cityExists;
    const city: City = {
      name: proj.location.city,
      metroAreaId: metroAreaId as number
    };
    if (cityExists === 0) {
      cityId = await postCity(city);
    }
    if (cityId === 0) {
      throw new CustomError('Failed to create city', 500);
    }

    const address: Address = {
      address: proj.location.address,
      postcode: proj.location.postcode,
      cityId: cityId,
      location: {
        type: 'Point',
        coordinates: [
          (proj.location.coordinates?.longitude as number) || 0,
          (proj.location.coordinates?.latitude as number) || 0
        ]
      }
    };

    const addressId = await postAddress(address);
    if (!addressId) {
      throw new CustomError('Failed to create address', 500);
    }

    const buildingTypeExists = await checkBuildingTypeExistsByName(
      proj.buildingType as string
    );
    let buildingTypeId = buildingTypeExists;
    const buildingType: BuildingType = {
      buildingType: proj.buildingType as string
    };
    if (buildingTypeExists === 0) {
      buildingTypeId = await postBuildingType(buildingType);
    }
    if (proj.glassFacade === 'null') {
      proj.glassFacade = null;
    }
    const expectedDate = parseToStandardDate(
      proj.expectedCompletionWindow?.expected || ''
    );

    const project: Project = {
      name: proj.name,
      expectedDateText:
        (proj.expectedCompletionWindow?.expected as string)?.slice(0, 100) ||
        null,
      earliestDateText:
        (proj.expectedCompletionWindow?.earliest as string)?.slice(0, 100) ||
        null,
      latestDateText:
        (proj.expectedCompletionWindow?.latest as string)?.slice(0, 100) ||
        null,
      expectedDate: new Date(expectedDate || ''),
      addressId: addressId,
      buildingTypeId: buildingTypeId,
      status: proj.status,
      budgetEur: proj.budgetEur,
      glassFacade: proj.glassFacade,
      facadeBasis: proj.facadeBasis,
      lastVerifiedDate: proj.lastVerifiedDate,
      confidenceScore: proj.confidenceScore,
      isActive: proj.isActive,
      projectKey: (proj.name.trim().toLowerCase() +
        '|' +
        proj.location.city.trim().toLowerCase() +
        '|' +
        proj.location.country.trim().toLowerCase()) as string,
      buildingHeightMeters: proj.buildingHeightMeters,
      buildingHeightFloors: proj.buildingHeightFloors
    };
    console.log(project);
    let projectId = 0;
    try {
      projectId = await postProject(project);
    } catch (error) {
      console.error('Failed to create project:', error);
    }
    try {
      if (changeType === 'manual') {
        await postProjectAudit({
          projectId,
          searchId: null,
          fieldName: 'project.added',
          oldValue: null,
          newValue: JSON.stringify(proj),
          changeType: 'manual',
          changedBy: null
        });
      }
      await postProjectAudit({
        projectId,
        searchId: null,
        fieldName: 'project.added',
        oldValue: null,
        newValue: JSON.stringify(proj),
        changeType: 'automated',
        changedBy: null
      });
    } catch (error) {
      console.warn('Failed to log project creation audit:', error);
    }
    try {
      for (const url of proj.projectWebsites || []) {
        await postProjectWebsite({ projectId: projectId, url: url });
      }
    } catch (error) {
      console.warn('Failed to add project website:', error);
    }

    // Log project creation in project audits
    for (const bu of proj.buildingUse || []) {
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
    try {
      for (const developer of proj.developers || []) {
        const developerExists = await checkDeveloperExistsByName(
          developer.name
        );
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
        if (countryID !== 0) {
          const developerPresenceExists = await checkDeveloperPresenceInCountry(
            developerId,
            countryID
          );
          if (!developerPresenceExists) {
            await postDevelopersPresence({
              developerId: developerId,
              countryId: countryID
            });
          }
        }
      }
    } catch (error) {
      console.warn('Failed to add developer:', error);
    }
    try {
      for (const architect of proj.architects || []) {
        const architectExists = await checkArchitectExistsByName(
          architect.name
        );
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
        if (countryID !== 0) {
          const architectPresenceExists = await checkArchitectPresenceInCountry(
            architectId,
            countryID
          );
          if (!architectPresenceExists) {
            await postArchitectsPresence({
              architectId: architectId,
              countryId: countryID
            });
          }
        }
      }
    } catch (error) {
      console.warn('Failed to add architect:', error);
    }
    try {
      for (const contractor of proj.contractors || []) {
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
        if (countryID !== 0) {
          const contractorPresenceExists =
            await checkContractorPresenceInCountry(contractorId, countryID);
          if (!contractorPresenceExists) {
            await postContractorsPresence({
              contractorId: contractorId,
              countryId: countryID
            });
          }
        }
      }
    } catch (error) {
      console.warn('Failed to add contractor:', error);
    }
    try {
      for (const consultant of proj.consultants || []) {
        const consultantExists = await checkConsultantExistsByName(
          consultant.name
        );
        let consultantId = consultantExists;
        console.log({ consultantId });
        if (consultantExists === 0) {
          const c: Consultant = {
            name: consultant.name,
            website: consultant.website,
            hqCountryId: null,
            email: consultant.contact?.email,
            phone: consultant.contact?.phone
          };
          consultantId = await postConsultant(c);
          console.log({ consultantId });
        }
        if (consultantId === 0) {
          throw new CustomError('Failed to create consultant', 500);
        }
        await postProjectConsultant({
          projectId: projectId,
          consultantId: consultantId as number,
          source: consultant.source as string
        });
        if (countryID !== 0) {
          const consultantPresenceExists = await checkConsultantsPresenceExists(
            consultantId as number,
            countryID
          );
          if (!consultantPresenceExists) {
            await postConsultantsPresence({
              consultantId: consultantId as number,
              countryId: countryID
            });
          }
        }
      }
    } catch (error) {
      console.warn('Failed to add consultant:', error);
    }
    try {
      for (const media of proj.media || []) {
        const mediaData: ProjectMedia = {
          url: media.url,
          projectId: projectId,
          title: media.title ?? null,
          mediaType: media.mediaType
        };
        //file uploads not yet implemented
        await postProjectMedia(mediaData);
      }
    } catch (error) {
      console.warn('Failed to add media:', error);
    }
    try {
      for (const source of proj.sources || []) {
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
      console.warn('Failed to add source link:', error);
    }
    // Compose a detailed result object
    return {
      projectId,
      projectName: proj.name,
      location: proj.location,
      buildingType: proj.buildingType,
      status: proj.status,
      budgetEur: proj.budgetEur,
      glassFacade: proj.glassFacade,
      lastVerifiedDate: proj.lastVerifiedDate,
      developers: proj.developers?.map((d: any) => d.name) || [],
      architects: proj.architects?.map((a: any) => a.name) || [],
      contractors: proj.contractors?.map((c: any) => c.name) || [],
      media: proj.media?.map((m: any) => m.url) || [],
      projectWebsites: proj.projectWebsites || [],
      sources: proj.sources || [],
      auditLogged: true,
      created: true
    };
  } catch (error) {
    console.warn('Failed to add project:', error);
    return {
      projectId: null,
      error: error instanceof Error ? error.message : 'Unknown error',
      created: false
    };
  }
};

export { applyEnrichedDataToProject, addNewProjectToDB };
