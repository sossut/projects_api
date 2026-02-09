import { validationResult } from 'express-validator';

import {
  putProject,
  deleteProject,
  getAllProjects,
  getProject
} from '../models/projectModel';
import { postProjectAudit } from '../models/projectAuditModel';
import { Request, Response, NextFunction } from 'express';
import { PostProject, Project } from '../../interfaces/Project';

import CustomError from '../../classes/CustomError';
import MessageResponse from '../../interfaces/MessageResponse';
import {
  throwIfValidationErrors,
  toCamel,
  parseToStandardDate
} from '../../utils/utilities';
import { User } from '../../interfaces/User';
import {} from '../models/continentModel';
import { checkCountryExistsByName } from '../models/countryModel';

import { Address } from '../../interfaces/Address';

import { getAddressByProjectId, putAddress } from '../models/addressModel';

import {
  checkBuildingUseExistsByName,
  postBuildingUse
} from '../models/buildingUseModel';
import {
  checkProjectBuildingUseExists,
  postProjectBuildingUse
} from '../models/projectBuildingUseModel';
import { ProjectBuildingUse } from '../../interfaces/ProjectBuildingUse';

import {
  checkDeveloperExistsByName,
  postDeveloper,
  putDeveloper
} from '../models/developerModel';

import { postProjectDeveloper } from '../models/projectDeveloperModel';
import {
  checkArchitectExistsByName,
  postArchitect,
  putArchitect
} from '../models/architectModel';

import { postProjectArchitect } from '../models/projectArchitectModel';

import {
  checkContractorExistsByName,
  postContractor,
  putContractor
} from '../models/contractorModel';
import { postProjectContractor } from '../models/projectContractorModel';

import {
  checkProjectMediaExistsByUrl,
  postProjectMedia
} from '../models/projectMediaModel';
import {
  checkSourceLinkExistsByUrl,
  postSourceLink
} from '../models/sourceLinkModel';
import {
  checkProjectWebsiteExistsByUrl,
  postProjectWebsite
} from '../models/projectWebsiteModel';
import {
  postDevelopersPresence,
  checkDeveloperPresenceInCountry
} from '../models/developersPresenceModel';
import {
  postArchitectsPresence,
  checkArchitectPresenceInCountry
} from '../models/architectsPresenceModel';
import {
  postContractorsPresence,
  checkContractorPresenceInCountry
} from '../models/contractorsPresenceModel';
import { addNewProjectToDB } from '../../utils/applyEnrichedDataToProject';

const projectListGet = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const sortBy = req.query.sortBy as string | undefined;
    const order = req.query.order as 'asc' | 'desc' | undefined;

    // Build filters object from query params
    const filters: { [key: string]: string | number } = {};
    if (req.query.status) filters.status = req.query.status as string;
    if (req.query.city) filters.city = req.query.city as string;
    if (req.query.metroArea) filters.metroArea = req.query.metroArea as string;
    if (req.query.country) filters.country = req.query.country as string;
    if (req.query.continent) filters.continent = req.query.continent as string;
    if (req.query.buildingType)
      filters.buildingType = req.query.buildingType as string;
    if (req.query.minBudget)
      filters.minBudget = parseFloat(req.query.minBudget as string);
    if (req.query.maxBudget)
      filters.maxBudget = parseFloat(req.query.maxBudget as string);

    const rows = await getAllProjects(
      sortBy,
      order === 'desc' ? 'DESC' : 'ASC',
      Object.keys(filters).length > 0 ? filters : undefined
    );
    const projects = rows.map((row) => toCamel(row));
    res.json(projects);
  } catch (err) {
    next(err);
  }
};

const projectGet = async (
  req: Request<{ id: number }, {}, {}>,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req);
    throwIfValidationErrors(errors);
    const project = toCamel(await getProject(req.params.id as number));
    res.json(project);
  } catch (err) {
    next(err);
  }
};

const projectGetFormatted = async (
  req: Request<{ id: number }, {}, {}>,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req);
    throwIfValidationErrors(errors);
    const project = toCamel(await getProject(req.params.id as number));
    //formatted response
    console.log(project);
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
    console.log(formattedProject.architects);
    res.json(formattedProject);
  } catch (err) {
    next(err);
  }
};

const projectPost = async (
  req: Request<{}, {}, PostProject>,
  res: Response,
  next: NextFunction
) => {
  try {
    const createdProjectIds: number[] = [];
    const skippedProjects: string[] = [];

    for (const proj of req.body.projects || []) {
      const projectId = await addNewProjectToDB(proj);

      if (projectId) {
        createdProjectIds.push(projectId);
      }
    }

    const response: MessageResponse = {
      message: `Created ${createdProjectIds.length} projects${skippedProjects.length > 0 ? `, skipped ${skippedProjects.length} duplicates` : ''}`,
      ids: createdProjectIds,
      skipped: skippedProjects.length > 0 ? skippedProjects : undefined
    };
    res.json(response);
  } catch (err) {
    next(err);
  }
};

const projectPut = async (
  req: Request<{ id: number }, {}, PostProject>,
  res: Response,
  next: NextFunction
) => {
  try {
    // const user = req.user as User;
    // if (user.role !== 'admin') {
    //   throw new CustomError('Unauthorized', 401);
    // }

    const errors = validationResult(req);
    throwIfValidationErrors(errors);
    const p = toCamel(await getProject(req.params.id as number));
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
      buildingUse: p.buildingUses?.map((bu: any) => ({
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
      media: p.projectMedias,
      sources: p.sourceLinks
    };
    const timeNow = new Date(Date.now());
    req.body.lastVerifiedDate = timeNow;
    const address = await getAddressByProjectId(req.params.id as number);
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
      if (f.old !== f.new) {
        await postProjectAudit({
          projectId: req.params.id as number,
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
          projectId: req.params.id as number,
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
          projectId: req.params.id as number,
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
            projectId: req.params.id as number,
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
          projectId: req.params.id as number,
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
          projectId: req.params.id as number,
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
            projectId: req.params.id as number,
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
          projectId: req.params.id as number,
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
          projectId: req.params.id as number,
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
            projectId: req.params.id as number,
            fieldName: 'architects.updated',
            oldValue: JSON.stringify(oldA),
            newValue: JSON.stringify(newA),
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
          projectId: req.params.id as number,
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
          projectId: req.params.id as number,
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
            projectId: req.params.id as number,
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
          projectId: req.params.id as number,
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
          projectId: req.params.id as number,
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
            projectId: req.params.id as number,
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
        (req.body.expectedCompletionWindow?.expected as string)?.slice(
          0,
          100
        ) || null,
      earliestDateText:
        (req.body.expectedCompletionWindow?.earliest as string)?.slice(
          0,
          100
        ) || null,
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
        console.log(architect);
        architectId = await postArchitect({
          name: architect.name,
          website: architect.website,
          hqCountryId: null,
          email: architect.contact?.email,
          phone: architect.contact?.phone
        });
        await postProjectArchitect({
          projectId: req.params.id as number,
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
        contractorId = await postContractor({
          name: contractor.name,
          website: contractor.website,
          hqCountryId: null,
          email: contractor.contact?.email,
          phone: contractor.contact?.phone
        });
        await postProjectContractor({
          projectId: req.params.id as number,
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
        developerId = await postDeveloper({
          name: developer.name,
          website: developer.website,
          hqCountryId: null,
          email: developer.contact?.email,
          phone: developer.contact?.phone
        });
        await postProjectDeveloper({
          projectId: req.params.id as number,
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
    for (const media of req.body.media || []) {
      console.log(media.title);
      const checkMedia = await checkProjectMediaExistsByUrl(media.url);
      if (!checkMedia) {
        await postProjectMedia({
          projectId: req.params.id as number,
          url: media.url,
          title: media.title,
          mediaType: media.mediaType
        });
      }
    }
    for (const bu of req.body.buildingUse || []) {
      console.log({ bu });
      const buildingUseExists = await checkBuildingUseExistsByName(bu);
      let buildingUseId = buildingUseExists;
      if (buildingUseExists === 0) {
        buildingUseId = await postBuildingUse({ buildingUse: bu });
      }
      if (buildingUseId === 0) {
        throw new CustomError('Failed to create building use', 500);
      }
      console.log('test2');
      const checkProjectBuildingUse = await checkProjectBuildingUseExists(
        req.params.id as number,
        buildingUseId
      );
      if (!checkProjectBuildingUse) {
        const projectBuildingUse: ProjectBuildingUse = {
          projectId: req.params.id as number,
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
          projectId: req.params.id as number,
          url: url
        });
      }
    }
    for (const source of req.body.sources || []) {
      const checkSource = await checkSourceLinkExistsByUrl(source.url);
      if (!checkSource) {
        await postSourceLink({
          projectId: req.params.id as number,
          url: source.url,
          sourceType: source.sourceType,
          publisher: source.publisher,
          accessedAt: source.accessedAt
        });
      }
    }

    const success = await putProject(project, req.params.id as number);
    if (success) {
      // Example: log an audit for the update (expand as needed)
      await postProjectAudit({
        projectId: req.params.id as number,
        fieldName: 'project',
        oldValue: null, // You can fetch and stringify the old project if needed
        newValue: JSON.stringify(req.body),
        changeType: 'manual',
        changedBy: null // Set user id if available
      });
      const response: MessageResponse = {
        message: 'Project updated successfully',
        id: req.params.id
      };
      res.json(response);
    }
  } catch (err) {
    next(err);
  }
};
const projectDelete = async (
  req: Request<{ id: number }, {}, {}>,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user as User;
    if (user.role !== 'admin') {
      throw new CustomError('Unauthorized', 401);
    }
    const errors = validationResult(req);
    throwIfValidationErrors(errors);
    const success = await deleteProject(req.params.id as number);
    if (success) {
      const response: MessageResponse = {
        message: 'Project deleted successfully',
        id: req.params.id
      };
      res.json(response);
    }
  } catch (err) {
    next(err);
  }
};

export {
  projectListGet,
  projectGet,
  projectGetFormatted,
  projectPost,
  projectPut,
  projectDelete
};
