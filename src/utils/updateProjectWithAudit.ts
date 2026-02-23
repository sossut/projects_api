import { getAddressByProjectId, putAddress } from '../api/models/addressModel';
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
  checkConsultantExistsByName,
  postConsultant,
  putConsultant
} from '../api/models/consultantModel';
import {
  checkConsultantsPresenceExists,
  postConsultantsPresence
} from '../api/models/consultantsPresenceModel';
import {
  checkContractorExistsByName,
  postContractor,
  putContractor
} from '../api/models/contractorModel';
import {
  checkContractorPresenceInCountry,
  postContractorsPresence
} from '../api/models/contractorsPresenceModel';
import { checkCountryExistsByName } from '../api/models/countryModel';
import {
  checkDeveloperExistsByName,
  postDeveloper,
  putDeveloper
} from '../api/models/developerModel';
import {
  checkDeveloperPresenceInCountry,
  postDevelopersPresence
} from '../api/models/developersPresenceModel';
import { postProjectArchitect } from '../api/models/projectArchitectModel';
import { postProjectAudit } from '../api/models/projectAuditModel';
import {
  checkProjectBuildingUseExists,
  postProjectBuildingUse
} from '../api/models/projectBuildingUseModel';
import { postProjectConsultant } from '../api/models/projectConstultantModel';
import { postProjectContractor } from '../api/models/projectContractorModel';
import { postProjectDeveloper } from '../api/models/projectDeveloperModel';
import {
  checkProjectMediaExistsByUrl,
  postProjectMedia
} from '../api/models/projectMediaModel';

import { getProject, putProject } from '../api/models/projectModel';

import {
  checkProjectWebsiteExistsByUrl,
  postProjectWebsite
} from '../api/models/projectWebsiteModel';
import {
  checkSourceLinkExistsByUrl,
  postSourceLink
} from '../api/models/sourceLinkModel';
import CustomError from '../classes/CustomError';
import { Address } from '../interfaces/Address';
import MessageResponse from '../interfaces/MessageResponse';
import { Project } from '../interfaces/Project';
import { ProjectBuildingUse } from '../interfaces/ProjectBuildingUse';

import { parseToStandardDate, toCamel } from './utilities';
//Helper function to update project with audit logging
const updateProjectWithAudit = async (projectId: number, req: any) => {
  const p = toCamel(await getProject(projectId as number));
  //formatted response
  console.log(p);
  const formattedProjectOld = {
    id: p.id,
    name: p.name,
    buildingHeightMeters: p.buildingHeightMeters,
    buildingHeightFloors: p.buildingHeightFloors,
    location: {
      address: p.address.address,
      city: p.address.city.name,
      country: p.address.country.name,
      metroArea: p.address.metroArea.name,
      postcode: p.address.postcode,
      coordinates: p.address.location
    },
    expectedCompletionWindow: {
      expected: p.expectedDateText,
      earliest: p.earliestDateText,
      latest: p.latestDateText
    },
    buildingType: p.buildingType,
    buildingUses: p.buildingUses?.map((bu: any) => ({
      buildingUse: bu.buildingUse
    })),
    budgetEur: p.budgetEur,
    glassFacade: p.glassFacade,
    facadeBasis: p.facadeBasis,
    status: p.status,
    lastVerifiedDate: p.lastVerifiedDate,
    confidenceScore: p.confidenceScore,
    isActive: p.isActive,
    projectWebsites: p.projectWebsites,
    developers:
      p.developers?.map((dev: any) => ({
        name: dev.name,
        website: dev.contact?.website ?? dev.website,
        source: dev.source,
        contact: {
          phone: dev.contact?.phone ?? dev.phone,
          email: dev.contact?.email ?? dev.email
        }
      })) || [],
    architects:
      p.architects?.map((arch: any) => ({
        name: arch.name,
        website: arch.contact?.website ?? arch.website,
        source: arch.source,
        contact: {
          phone: arch.contact?.phone ?? arch.phone,
          email: arch.contact?.email ?? arch.email
        }
      })) || [],
    contractors:
      p.contractors?.map((cont: any) => ({
        name: cont.name,
        source: cont.source,
        website: cont.contact?.website ?? cont.website,
        contact: {
          phone: cont.contact?.phone ?? cont.phone,
          email: cont.contact?.email ?? cont.email
        }
      })) || [],
    consultants:
      p.consultants?.map((cons: any) => ({
        name: cons.name,
        source: cons.source,
        website: cons.contact?.website ?? cons.website,
        contact: {
          phone: cons.contact?.phone ?? cons.phone,
          email: cons.contact?.email ?? cons.email
        }
      })) || [],
    media: p.projectMedias,
    sources: p.sourceLinks
  };
  const timeNow = new Date(Date.now());
  req.body.lastVerifiedDate = timeNow;
  const address = await getAddressByProjectId(projectId as number);
  if (!address) {
    throw new CustomError('Address not found for project', 500);
  }
  const countryId = await checkCountryExistsByName(
    req.body.location?.country as string
  );
  // Audit logging for all relevant fields
  const auditFields = [
    { field: 'name', old: formattedProjectOld.name, new: req.body.name },
    {
      field: 'buildingHeightMeters',
      old: formattedProjectOld.buildingHeightMeters,
      new: req.body.buildingHeightMeters
    },
    {
      field: 'buildingHeightFloors',
      old: formattedProjectOld.buildingHeightFloors,
      new: req.body.buildingHeightFloors
    },
    {
      field: 'location.address',
      old: formattedProjectOld.location.address,
      new: req.body.location?.address
    },
    {
      field: 'location.city',
      old: formattedProjectOld.location.city,
      new: req.body.location?.city
    },
    {
      field: 'location.country',
      old: formattedProjectOld.location.country,
      new: req.body.location?.country
    },
    {
      field: 'location.metroArea',
      old: formattedProjectOld.location.metroArea,
      new: req.body.location?.metroArea
    },
    {
      field: 'location.postcode',
      old: formattedProjectOld.location.postcode,
      new: req.body.location?.postcode
    },
    {
      field: 'expectedCompletionWindow.expected',
      old: formattedProjectOld.expectedCompletionWindow.expected,
      new: req.body.expectedCompletionWindow?.expected
    },
    {
      field: 'expectedCompletionWindow.earliest',
      old: formattedProjectOld.expectedCompletionWindow.earliest,
      new: req.body.expectedCompletionWindow?.earliest
    },
    {
      field: 'expectedCompletionWindow.latest',
      old: formattedProjectOld.expectedCompletionWindow.latest,
      new: req.body.expectedCompletionWindow?.latest
    },
    {
      field: 'buildingType',
      old: formattedProjectOld.buildingType,
      new: req.body.buildingType
    },
    {
      field: 'budgetEur',
      old: formattedProjectOld.budgetEur,
      new: req.body.budgetEur
    },
    {
      field: 'glassFacade',
      old: formattedProjectOld.glassFacade,
      new: req.body.glassFacade
    },
    {
      field: 'facadeBasis',
      old: formattedProjectOld.facadeBasis,
      new: req.body.facadeBasis
    },
    {
      field: 'status',
      old: formattedProjectOld.status,
      new: req.body.status
    },
    {
      field: 'lastVerifiedDate',
      old: formattedProjectOld.lastVerifiedDate,
      new: req.body.lastVerifiedDate
    },
    {
      field: 'confidenceScore',
      old: formattedProjectOld.confidenceScore,
      new: req.body.confidenceScore
    },
    {
      field: 'isActive',
      old: formattedProjectOld.isActive,
      new: req.body.isActive
    }
  ];
  for (const f of auditFields) {
    if (f.old !== f.new && f.new) {
      console.log({ f });
      await postProjectAudit({
        projectId: projectId as number,
        fieldName: f.field,
        oldValue: f.old,
        newValue: f.new as string,
        changeType: 'manual',
        changedBy: null // Set user id if available
      });
    }
  }
  // Robust contractor audit logging
  const oldContractorsArr = formattedProjectOld.contractors || [];
  const newContractorsArr = req.body.contractors || [];
  const oldContractorMap = new Map();
  for (const c of oldContractorsArr) {
    oldContractorMap.set(c.name, c);
  }
  const newContractorMap = new Map();
  for (const c of newContractorsArr) {
    newContractorMap.set(c.name, c);
  }
  // Detect removals
  for (const [name, oldC] of oldContractorMap.entries()) {
    if (!newContractorMap.has(name)) {
      await postProjectAudit({
        projectId: projectId as number,
        fieldName: 'contractors.removed',
        oldValue: JSON.stringify(oldC),
        newValue: null,
        changeType: 'manual',
        changedBy: null
      });
    }
  }
  // Detect additions
  for (const [name, newC] of newContractorMap.entries()) {
    if (!oldContractorMap.has(name)) {
      await postProjectAudit({
        projectId: projectId as number,
        fieldName: 'contractors.added',
        oldValue: null,
        newValue: JSON.stringify(newC),
        changeType: 'manual',
        changedBy: null
      });
    }
  }
  // Detect updates
  for (const [name, oldC] of oldContractorMap.entries()) {
    if (newContractorMap.has(name)) {
      const newC = newContractorMap.get(name);
      if (JSON.stringify(oldC) !== JSON.stringify(newC)) {
        await postProjectAudit({
          projectId: projectId as number,
          fieldName: 'contractors.updated',
          oldValue: JSON.stringify(oldC),
          newValue: JSON.stringify(newC),
          changeType: 'manual',
          changedBy: null
        });
      }
    }
  }

  // Audit developers
  const oldDevelopersArr = formattedProjectOld.developers || [];
  const newDevelopersArr = req.body.developers || [];
  const oldDeveloperMap = new Map();
  for (const d of oldDevelopersArr) {
    oldDeveloperMap.set(d.name, d);
  }
  const newDeveloperMap = new Map();
  for (const d of newDevelopersArr) {
    newDeveloperMap.set(d.name, d);
  }

  // Detect removals
  for (const [name, oldD] of oldDeveloperMap.entries()) {
    if (!newDeveloperMap.has(name)) {
      await postProjectAudit({
        projectId: projectId as number,
        fieldName: 'developers.removed',
        oldValue: JSON.stringify(oldD),
        newValue: null,
        changeType: 'manual',
        changedBy: null
      });
    }
  }
  // Detect additions
  for (const [name, newD] of newDeveloperMap.entries()) {
    if (!oldDeveloperMap.has(name)) {
      await postProjectAudit({
        projectId: projectId as number,
        fieldName: 'developers.added',
        oldValue: null,
        newValue: JSON.stringify(newD),
        changeType: 'manual',
        changedBy: null
      });
    }
  }

  // Detect updates
  for (const [name, oldD] of oldDeveloperMap.entries()) {
    if (newDeveloperMap.has(name)) {
      const newD = newDeveloperMap.get(name);
      if (JSON.stringify(oldD) !== JSON.stringify(newD)) {
        await postProjectAudit({
          projectId: projectId as number,
          fieldName: 'developers.updated',
          oldValue: JSON.stringify(oldD),
          newValue: JSON.stringify(newD),
          changeType: 'manual',
          changedBy: null
        });
      }
    }
  }

  // Audit architects
  const oldArchitects = formattedProjectOld.architects || [];
  const newArchitects = req.body.architects || [];
  const oldArchitectMap = new Map();
  for (const a of oldArchitects) {
    oldArchitectMap.set(a.name, a);
  }
  const newArchitectMap = new Map();
  for (const a of newArchitects) {
    newArchitectMap.set(a.name, a);
  }
  // Detect removals
  for (const [name, oldA] of oldArchitectMap.entries()) {
    if (!newArchitectMap.has(name)) {
      await postProjectAudit({
        projectId: projectId as number,
        fieldName: 'architects.removed',
        oldValue: JSON.stringify(oldA),
        newValue: null,
        changeType: 'manual',
        changedBy: null
      });
    }
  }
  // Detect additions
  for (const [name, newA] of newArchitectMap.entries()) {
    if (!oldArchitectMap.has(name)) {
      await postProjectAudit({
        projectId: projectId as number,
        fieldName: 'architects.added',
        oldValue: null,
        newValue: JSON.stringify(newA),
        changeType: 'manual',
        changedBy: null
      });
    }
  }

  // Detect updates
  for (const [name, oldA] of oldArchitectMap.entries()) {
    if (newArchitectMap.has(name)) {
      const newA = newArchitectMap.get(name);
      if (JSON.stringify(oldA) !== JSON.stringify(newA)) {
        await postProjectAudit({
          projectId: projectId as number,
          fieldName: 'architects.updated',
          oldValue: JSON.stringify(oldA),
          newValue: JSON.stringify(newA),
          changeType: 'manual',
          changedBy: null
        });
      }
    }
  }

  //Audit Consultants
  // (Similar to architects, developers, contractors - omitted for brevity)
  const oldConsultants = formattedProjectOld.consultants || [];
  const newConsultants = req.body.consultants || [];
  const oldConsultantMap = new Map();
  for (const c of oldConsultants) {
    oldConsultantMap.set(c.name, c);
  }
  const newConsultantMap = new Map();
  for (const c of newConsultants) {
    newConsultantMap.set(c.name, c);
  }
  // Detect removals
  for (const [name, oldC] of oldConsultantMap.entries()) {
    if (!newConsultantMap.has(name)) {
      await postProjectAudit({
        projectId: projectId as number,
        fieldName: 'consultants.removed',
        oldValue: JSON.stringify(oldC),
        newValue: null,
        changeType: 'manual',
        changedBy: null
      });
    }
  }
  // Detect additions
  for (const [name, newC] of newConsultantMap.entries()) {
    if (!oldConsultantMap.has(name)) {
      await postProjectAudit({
        projectId: projectId as number,
        fieldName: 'consultants.added',
        oldValue: null,
        newValue: JSON.stringify(newC),
        changeType: 'manual',
        changedBy: null
      });
    }
  }
  // Detect updates
  for (const [name, oldC] of oldConsultantMap.entries()) {
    if (newConsultantMap.has(name)) {
      const newC = newConsultantMap.get(name);
      if (JSON.stringify(oldC) !== JSON.stringify(newC)) {
        await postProjectAudit({
          projectId: projectId as number,
          fieldName: 'consultants.updated',
          oldValue: JSON.stringify(oldC),
          newValue: JSON.stringify(newC),
          changeType: 'manual',
          changedBy: null
        });
      }
    }
  }

  // Audit sources
  const oldSources = formattedProjectOld.sources || [];
  const newSources = req.body.sources || [];
  const oldSourceMap = new Map();
  for (const s of oldSources) {
    oldSourceMap.set(s.url, s);
  }
  const newSourceMap = new Map();
  for (const s of newSources) {
    newSourceMap.set(s.url, s);
  }
  // Detect removals
  for (const [url, oldS] of oldSourceMap.entries()) {
    if (!newSourceMap.has(url)) {
      await postProjectAudit({
        projectId: projectId as number,
        fieldName: 'sources.removed',
        oldValue: JSON.stringify(oldS),
        newValue: null,
        changeType: 'manual',
        changedBy: null
      });
    }
  }
  // Detect additions
  for (const [url, newS] of newSourceMap.entries()) {
    if (!oldSourceMap.has(url)) {
      await postProjectAudit({
        projectId: projectId as number,
        fieldName: 'sources.added',
        oldValue: null,
        newValue: JSON.stringify(newS),
        changeType: 'manual',
        changedBy: null
      });
    }
  }
  // Detect updates
  for (const [url, oldS] of oldSourceMap.entries()) {
    if (newSourceMap.has(url)) {
      const newS = newSourceMap.get(url);
      if (JSON.stringify(oldS) !== JSON.stringify(newS)) {
        await postProjectAudit({
          projectId: projectId as number,
          fieldName: 'sources.updated',
          oldValue: JSON.stringify(oldS),
          newValue: JSON.stringify(newS),
          changeType: 'manual',
          changedBy: null
        });
      }
    }
  }

  // Audit media
  const oldMedia = formattedProjectOld.media || [];
  const newMedia = req.body.media || [];
  const oldMediaMap = new Map();
  for (const m of oldMedia) {
    oldMediaMap.set(m.url, m);
  }
  const newMediaMap = new Map();
  for (const m of newMedia) {
    newMediaMap.set(m.url, m);
  }
  // Detect removals
  for (const [url, oldM] of oldMediaMap.entries()) {
    if (!newMediaMap.has(url)) {
      await postProjectAudit({
        projectId: projectId as number,
        fieldName: 'media.removed',
        oldValue: JSON.stringify(oldM),
        newValue: null,
        changeType: 'manual',
        changedBy: null
      });
    }
  }
  // Detect additions
  for (const [url, newM] of newMediaMap.entries()) {
    if (!oldMediaMap.has(url)) {
      await postProjectAudit({
        projectId: projectId as number,
        fieldName: 'media.added',
        oldValue: null,
        newValue: JSON.stringify(newM),
        changeType: 'manual',
        changedBy: null
      });
    }
  }
  // Detect updates
  for (const [url, oldM] of oldMediaMap.entries()) {
    if (newMediaMap.has(url)) {
      const newM = newMediaMap.get(url);
      if (JSON.stringify(oldM) !== JSON.stringify(newM)) {
        await postProjectAudit({
          projectId: projectId as number,
          fieldName: 'media.updated',
          oldValue: JSON.stringify(oldM),
          newValue: JSON.stringify(newM),
          changeType: 'manual',
          changedBy: null
        });
      }
    }
  }

  if (req.body.location) {
    const a: Address = {
      address: req.body.location.address,
      location: {
        type: 'Point',
        coordinates: [
          (req.body.location.coordinates?.longitude as number) || 0,
          (req.body.location.coordinates?.latitude as number) || 0
        ]
      },
      postcode: req.body.location.postcode
    };
    await putAddress(a, address.id as number);
  }
  const expectedDate = parseToStandardDate(
    req.body.expectedCompletionWindow?.expected || ''
  );
  const project: Project = {
    name: req.body.name,
    expectedDateText:
      (req.body.expectedCompletionWindow?.expected as string)?.slice(0, 100) ||
      null,
    earliestDateText:
      (req.body.expectedCompletionWindow?.earliest as string)?.slice(0, 100) ||
      null,
    latestDateText:
      (req.body.expectedCompletionWindow?.latest as string)?.slice(0, 100) ||
      null,
    expectedDate: new Date(expectedDate || ''),
    addressId: address.id as number,
    buildingTypeId: req.body.buildingTypeId,
    status: req.body.status,
    budgetEur: req.body.budgetEur,
    glassFacade: req.body.glassFacade,
    facadeBasis: req.body.facadeBasis,
    lastVerifiedDate: req.body.lastVerifiedDate,
    confidenceScore: req.body.confidenceScore,
    isActive: req.body.isActive,
    buildingHeightMeters: req.body.buildingHeightMeters,
    buildingHeightFloors: req.body.buildingHeightFloors
  };
  for (const architect of req.body.architects || []) {
    const checkedArchitect = await checkArchitectExistsByName(architect.name);
    let architectId = checkedArchitect;
    if (checkedArchitect === 0) {
      if (architect.name) {
        console.log(architect);
        architectId = await postArchitect({
          name: architect.name,
          website: architect.website,
          hqCountryId: null,
          email: architect.contact?.email,
          phone: architect.contact?.phone
        });
        await postProjectArchitect({
          projectId: projectId as number,
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
    } else {
      await putArchitect(
        {
          name: architect.name,
          website: architect.website,
          // hqCountryId: null,
          email: architect.contact?.email,
          phone: architect.contact?.phone
        },
        architectId
      );
    }
  }
  for (const contractor of req.body.contractors || []) {
    const checkedContractor = await checkContractorExistsByName(
      contractor.name
    );
    let contractorId = checkedContractor;
    if (checkedContractor === 0) {
      if (contractor.name) {
        contractorId = await postContractor({
          name: contractor.name,
          website: contractor.website,
          hqCountryId: null,
          email: contractor.contact?.email,
          phone: contractor.contact?.phone
        });
        await postProjectContractor({
          projectId: projectId as number,
          contractorId: contractorId,
          source: contractor.source as string
        });
        if (countryId !== 0) {
          const contractorPresenceExists =
            await checkContractorPresenceInCountry(contractorId, countryId);
          if (!contractorPresenceExists) {
            await postContractorsPresence({
              contractorId: contractorId,
              countryId: countryId
            });
          }
        }
      }
    } else {
      await putContractor(
        {
          name: contractor.name,
          website: contractor.website,
          // hqCountryId: null,
          email: contractor.contact?.email,
          phone: contractor.contact?.phone
        },
        contractorId
      );
    }
  }
  for (const developer of req.body.developers || []) {
    const checkedDeveloper = await checkDeveloperExistsByName(developer.name);
    let developerId = checkedDeveloper;
    if (checkedDeveloper === 0) {
      if (developer.name) {
        developerId = await postDeveloper({
          name: developer.name,
          website: developer.website,
          hqCountryId: null,
          email: developer.contact?.email,
          phone: developer.contact?.phone
        });
        await postProjectDeveloper({
          projectId: projectId as number,
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
    } else {
      await putDeveloper(
        {
          name: developer.name,
          website: developer.website,
          // hqCountryId: null,
          email: developer.contact?.email,
          phone: developer.contact?.phone
        },
        developerId
      );
    }
  }
  for (const consultant of req.body.consultants || []) {
    const checkedConsultant = await checkConsultantExistsByName(
      consultant.name
    );
    let consultantId = checkedConsultant;
    if (checkedConsultant === 0) {
      if (consultant.name) {
        consultantId = await postConsultant({
          name: consultant.name,
          website: consultant.website,
          hqCountryId: null,
          email: consultant.contact?.email,
          phone: consultant.contact?.phone
        });
        await postProjectConsultant({
          projectId: projectId as number,
          consultantId: consultantId,
          source: consultant.source as string
        });
        if (countryId !== 0) {
          const consultantPresenceExists = await checkConsultantsPresenceExists(
            consultantId,
            countryId
          );
          if (!consultantPresenceExists) {
            await postConsultantsPresence({
              consultantId: consultantId,
              countryId: countryId
            });
          }
        }
      }
    } else {
      // Update existing consultant details
      await putConsultant(
        {
          name: consultant.name,
          website: consultant.website,
          // hqCountryId: null,
          email: consultant.contact?.email,
          phone: consultant.contact?.phone
        },
        consultantId as number
      );
    }
  }

  // for (const media of req.body.projectMedias || []) {
  //   if (!media.url) continue;
  //   const checkMedia = await checkProjectMediaExistsByUrl(media.url);
  //   if (!checkMedia) {
  //     await postProjectMedia({
  //       projectId: projectId as number,
  //       url: media.url,
  //       title: media.title,
  //       mediaType: media.mediaType
  //     });
  //   }
  // }
  for (const media of req.body.media || []) {
    if (!media.url) continue;
    const checkMedia = await checkProjectMediaExistsByUrl(media.url);
    if (!checkMedia) {
      await postProjectMedia({
        projectId: projectId as number,
        url: media.url,
        title: media.title,
        mediaType: media.mediaType
      });
    }
  }

  for (const bu of req.body.buildingUses || []) {
    const buildingUseExists = await checkBuildingUseExistsByName(
      bu.buildingUse
    );
    let buildingUseId = buildingUseExists;
    if (buildingUseExists === 0) {
      buildingUseId = await postBuildingUse({ buildingUse: bu.buildingUse });
    }
    if (buildingUseId === 0) {
      throw new CustomError('Failed to create building use', 500);
    }
    console.log('test2');
    const checkProjectBuildingUse = await checkProjectBuildingUseExists(
      projectId as number,
      buildingUseId
    );
    if (!checkProjectBuildingUse) {
      const projectBuildingUse: ProjectBuildingUse = {
        projectId: projectId as number,
        buildingUseId: buildingUseId
      };
      console.log('test');
      await postProjectBuildingUse(projectBuildingUse);
    }
  }
  for (const url of req.body.projectWebsites || []) {
    const checkWebsite = await checkProjectWebsiteExistsByUrl(url);
    if (!checkWebsite) {
      await postProjectWebsite({
        projectId: projectId as number,
        url: url
      });
    }
  }
  for (const source of req.body.sources || []) {
    const checkSource = await checkSourceLinkExistsByUrl(source.url);
    if (!checkSource) {
      await postSourceLink({
        projectId: projectId as number,
        url: source.url,
        sourceType: source.sourceType,
        publisher: source.publisher,
        accessedAt: source.accessedAt
      });
    }
  }
  const success = await putProject(project, projectId as number);
  if (success) {
    // Example: log an audit for the update (expand as needed)
    await postProjectAudit({
      projectId: projectId as number,
      fieldName: 'project',
      oldValue: null, // You can fetch and stringify the old project if needed
      newValue: JSON.stringify(req.body),
      changeType: 'manual',
      changedBy: null // Set user id if available
    });
    const response: MessageResponse = {
      message: 'Project updated successfully',
      id: projectId
    };
    return response;
  } else {
    const response: MessageResponse = {
      message: 'Failed to update project',
      id: projectId
    };
    return response;
  }
};
export default updateProjectWithAudit;
