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
import {
  checkMetroAreaExistsByName,
  postMetroArea
} from '../api/models/metroAreaModel';
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
import { putProject } from '../api/models/projectModel';
import {
  checkProjectWebsiteExistsByUrl,
  postProjectWebsite
} from '../api/models/projectWebsiteModel';
import { Address } from '../interfaces/Address';
import { parseToStandardDate } from './utilities';


const applyEnrichedDataToProject = async ({
  projectId,
  project,
  enrichedData
}: {
  projectId: number;
  project: any;
  enrichedData: any;
}) => {
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
};

export default applyEnrichedDataToProject;
