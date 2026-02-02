import { Request, Response, NextFunction } from 'express';

import { postArchitect } from '../models/architectModel';
import { postDeveloper } from '../models/developerModel';
import { postContractor } from '../models/contractorModel';

import { validationResult } from 'express-validator';

import CustomError from '../../classes/CustomError';
import MessageResponse from '../../interfaces/MessageResponse';
import { throwIfValidationErrors } from '../../utils/utilities';
import { User } from '../../interfaces/User';
import { Company } from '../../interfaces/Company';

import { checkCountryExistsByName, postCountry } from '../models/countryModel';
import {
  checkContinentExistsByName,
  postContinent
} from '../models/continentModel';

const companiesPost = async (
  req: Request<{}, {}, Company>,
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
    const results = req.body.results || {};
    const contractors = results.contractors || [];
    const developers = results.developers || [];
    const architects = results.architects || [];

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
      }

      const c = {
        name: contractor.name,
        hqCountryId: countryId,
        website: contractor.website,
        email: contractor.email,
        phone: contractor.phone
      };
      await postContractor(c);
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
      const d = {
        name: developer.name,
        hqCountryId: countryId,
        website: developer.website,
        email: developer.email,
        phone: developer.phone
      };
      await postDeveloper(d);
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
      }
      architect.hqCountryId = countryId;
      const a = {
        name: architect.name,
        hqCountryId: countryId,
        website: architect.website,
        email: architect.email,
        phone: architect.phone
      };
      await postArchitect(a);
    }

    const response: MessageResponse = {
      message: 'Companies created successfully'
    };
    res.json(response);
  } catch (err) {
    next(err);
  }
};

export { companiesPost };
