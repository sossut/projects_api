import { Request, Response, NextFunction } from 'express';

import { postArchitect } from '../models/architectModel';
import { postDeveloper } from '../models/developerModel';
import { postContractor } from '../models/contractorModel';

import { validationResult } from 'express-validator';

import CustomError from '../../classes/CustomError';
import MessageResponse from '../../interfaces/MessageResponse';
import {
  findArchitectIdByName,
  findConsultantIdByName,
  findContractorIdByName,
  findDeveloperIdByName,
  throwIfValidationErrors
} from '../../utils/utilities';
// import { User } from '../../interfaces/User';
import { Company } from '../../interfaces/Company';

import { checkCountryExistsByName, postCountry } from '../models/countryModel';
import {
  checkContinentExistsByName,
  postContinent
} from '../models/continentModel';
import { postConsultant } from '../models/consultantModel';

const companiesPost = async (
  req: Request<{}, {}, Company>,
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
    const results = req.body.results || {};
    const contractors = results.contractors || [];
    const developers = results.developers || [];
    const architects = results.architects || [];
    const consultants = results.consultants || [];
    const newContractors = [];
    const newDevelopers = [];
    const newArchitects = [];
    const newConsultants = [];
    const oldContractors = [];
    const oldDevelopers = [];
    const oldArchitects = [];
    const oldConsultants = [];
    for (const contractor of contractors) {
      const continentExists = await checkContinentExistsByName(
        contractor.hqContinent as string
      );
      let continentId = continentExists;
      const continent = {
        name: contractor.hqContinent as string,
        code: null
      };
      if (continentExists === 0) {
        continentId = await postContinent(continent);
        if (continentId === 0) {
          throw new CustomError(
            `Failed to create continent ${contractor.hqContinent}`,
            500
          );
        }
      }

      const countryExists = await checkCountryExistsByName(
        contractor.hqCountry as string
      );
      let countryId = countryExists;
      if (countryExists === 0) {
        countryId = await postCountry({
          name: contractor.hqCountry as string,
          code: null,
          continentId: continentId
        });
        if (countryId === 0) {
          throw new CustomError(
            `Failed to create country ${contractor.hqCountry}`,
            500
          );
        }
      }
      const checkContractor = await findContractorIdByName(contractor.name);
      if (!checkContractor) {
        const c = {
          name: contractor.name,
          hqCountryId: countryId,
          website: contractor.website,
          email: contractor.email,
          phone: contractor.phone
        };
        const contractorResult = await postContractor(c);
        if (!contractorResult) {
          throw new CustomError(
            `Failed to create contractor ${contractor.name}`,
            500
          );
        } else {
          newContractors.push(contractorResult);
        }
      } else {
        oldContractors.push(checkContractor);
      }
    }
    for (const developer of developers) {
      const continentExists = await checkContinentExistsByName(
        developer.hqContinent as string
      );
      let continentId = continentExists;
      const continent = {
        name: developer.hqContinent as string,
        code: null
      };
      if (continentExists === 0) {
        continentId = await postContinent(continent);
        if (continentId === 0) {
          throw new CustomError(
            `Failed to create continent ${developer.hqContinent}`,
            500
          );
        }
      }
      const countryExists = await checkCountryExistsByName(
        developer.hqCountry as string
      );
      let countryId = countryExists;
      if (countryExists === 0) {
        countryId = await postCountry({
          name: developer.hqCountry as string,
          code: null,
          continentId: continentId
        });
      }
      const checkDeveloper = await findDeveloperIdByName(developer.name);
      if (!checkDeveloper) {
        const d = {
          name: developer.name,
          hqCountryId: countryId,
          website: developer.website,
          email: developer.email,
          phone: developer.phone
        };
        const developerResult = await postDeveloper(d);
        if (!developerResult) {
          throw new CustomError(
            `Failed to create developer ${developer.name}`,
            500
          );
        } else {
          newDevelopers.push(developerResult);
        }
      } else {
        oldDevelopers.push(checkDeveloper);
      }
    }
    for (const architect of architects) {
      const continentExists = await checkContinentExistsByName(
        architect.hqContinent as string
      );
      let continentId = continentExists;
      const continent = {
        name: architect.hqContinent as string,
        code: null
      };
      if (continentExists === 0) {
        continentId = await postContinent(continent);
        if (continentId === 0) {
          throw new CustomError(
            `Failed to create continent ${architect.hqContinent}`,
            500
          );
        }
      }
      const countryExists = await checkCountryExistsByName(
        architect.hqCountry as string
      );
      let countryId = countryExists;
      if (countryExists === 0) {
        countryId = await postCountry({
          name: architect.hqCountry as string,
          code: null,
          continentId: continentId
        });
        if (countryId === 0) {
          throw new CustomError(
            `Failed to create country ${architect.hqCountry}`,
            500
          );
        }
      }
      architect.hqCountryId = countryId;
      const checkArchitect = await findArchitectIdByName(architect.name);
      if (!checkArchitect) {
        const a = {
          name: architect.name,
          hqCountryId: countryId,
          website: architect.website,
          email: architect.email,
          phone: architect.phone
        };
        const architectResult = await postArchitect(a);
        if (!architectResult) {
          throw new CustomError(
            `Failed to create architect ${architect.name}`,
            500
          );
        } else {
          newArchitects.push(architectResult);
        }
      } else {
        oldArchitects.push(checkArchitect);
      }
    }
    for (const consultant of consultants) {
      const continentExists = await checkContinentExistsByName(
        consultant.hqContinent as string
      );
      let continentId = continentExists;
      const continent = {
        name: consultant.hqContinent as string,
        code: null
      };
      if (continentExists === 0) {
        continentId = await postContinent(continent);
        if (continentId === 0) {
          throw new CustomError(
            `Failed to create continent ${consultant.hqContinent}`,
            500
          );
        }
      }
      const countryExists = await checkCountryExistsByName(
        consultant.hqCountry as string
      );
      let countryId = countryExists;
      if (countryExists === 0) {
        countryId = await postCountry({
          name: consultant.hqCountry as string,
          code: null,
          continentId: continentId
        });
        if (countryId === 0) {
          throw new CustomError(
            `Failed to create country ${consultant.hqCountry}`,
            500
          );
        }
      }
      consultant.hqCountryId = countryId;
      const checkConsultant = await findConsultantIdByName(consultant.name);
      if (!checkConsultant) {
        const c = {
          name: consultant.name,
          hqCountryId: countryId,
          website: consultant.website,
          email: consultant.email,
          phone: consultant.phone
        };
        const consultantResult = await postConsultant(c);
        if (!consultantResult) {
          throw new CustomError(
            `Failed to create consultant ${consultant.name}`,
            500
          );
        } else {
          newConsultants.push(consultantResult);
        }
      } else {
        oldConsultants.push(checkConsultant);
      }
    }
    let response: MessageResponse;
    if (
      newContractors.length === 0 &&
      newDevelopers.length === 0 &&
      newArchitects.length === 0 &&
      newConsultants.length === 0
    ) {
      response = {
        message: 'No new companies were created'
      };
    } else {
      response = {
        message: 'Companies created successfully',
        data: {
          newDevelopers: newDevelopers.length > 0 ? newDevelopers : undefined,
          newArchitects: newArchitects.length > 0 ? newArchitects : undefined,
          newContractors:
            newContractors.length > 0 ? newContractors : undefined,
          newConsultants: newConsultants.length > 0 ? newConsultants : undefined
        }
      };
    }
    res.json(response);
  } catch (err) {
    next(err);
  }
};

export { companiesPost };
