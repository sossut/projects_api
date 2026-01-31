const projectsQueryString = `SELECT projects.id, projects.name,
    JSON_OBJECT(
      'id', addresses.id,
      'address', addresses.address,
      'cityId', addresses.city_id,
      'postalCode', addresses.postcode,
      'location', JSON_OBJECT(
        'latitude', ST_Y(addresses.location),
        'longitude', ST_X(addresses.location)
      ),
      'city', JSON_OBJECT(
        'id', cities.id,
        'name', cities.name,
        'metroAreaId', cities.metro_area_id
      ),
      'country', JSON_OBJECT(
        'id', countries.id,
        'name', countries.name,
        'code', countries.code
      ),
      'metroArea', JSON_OBJECT(
        'id', metro_areas.id,
        'name', metro_areas.name,
        'countryId', metro_areas.country_id
      )
    ) AS address,
     building_types.building_type AS buildingType,
    CONCAT('[', GROUP_CONCAT(DISTINCT
      JSON_OBJECT(
        'id', building_uses.id,
        'buildingUse', building_uses.building_use
      )
    ), ']') AS buildingUses,
    address_id AS addressId, expected_date_text AS expectedDateText,
    earliest_date_text AS earliestDateText, latest_date_text AS latestDateText, building_height_meters AS buildingHeightMeters,
    building_height_floors AS buildingHeightFloors, building_type_id AS buildingTypeId,
    budget_eur AS budgetEur, glass_facade AS glassFacade, facade_basis AS facadeBasis,
    status, last_verified_date AS lastVerifiedDate, confidence_score AS confidenceScore,
    is_active AS isActive, project_key AS projectKey,
    CONCAT('[', GROUP_CONCAT(DISTINCT
      JSON_OBJECT(
        'id', project_websites.id,
        'url', project_websites.url
      )
    ), ']') AS projectWebsites,
    CONCAT('[', GROUP_CONCAT(DISTINCT
    JSON_OBJECT(
      'id', developers.id,
      'name', developers.name,
      'website', developers.website,
      'phone', developers.phone,
      'email', developers.email
          )
        ), ']') AS developers,
    CONCAT('[', GROUP_CONCAT(DISTINCT
    JSON_OBJECT(
      'id', architects.id,
      'name', architects.name,
      'website', architects.website,
      'phone', architects.phone,
      'email', architects.email
          )
        ), ']') AS architects,
    CONCAT('[', GROUP_CONCAT(DISTINCT
    JSON_OBJECT(
      'id', contractors.id,
      'name', contractors.name,
      'website', contractors.website,
      'phone', contractors.phone,
      'email', contractors.email
          )
        ), ']') AS contractors,
    CONCAT('[', GROUP_CONCAT(DISTINCT
      JSON_OBJECT(
        'id', project_medias.id,
        'mediaType', project_medias.media_type,
        'url', project_medias.url,
        'title', project_medias.title,
        'filename', project_medias.filename
      )
    ), ']') AS projectMedias,
    CONCAT('[', GROUP_CONCAT(DISTINCT
      JSON_OBJECT(
        'id', source_links.id,
        'url', source_links.url,
        'sourceType', source_links.source_type,
        'publisher', source_links.publisher,
        'accessedAt', source_links.accessed_at
      )
    ), ']') AS sourceLinks
    FROM projects
    LEFT JOIN project_websites ON projects.id = project_websites.project_id
    LEFT JOIN addresses ON projects.address_id = addresses.id
    LEFT JOIN cities ON addresses.city_id = cities.id
    LEFT JOIN metro_areas ON cities.metro_area_id = metro_areas.id
    LEFT JOIN countries ON metro_areas.country_id = countries.id
    LEFT JOIN building_types ON projects.building_type_id = building_types.id
    LEFT JOIN project_building_uses ON projects.id = project_building_uses.project_id
    LEFT JOIN building_uses ON project_building_uses.building_use_id = building_uses.id
    LEFT JOIN project_developers ON projects.id = project_developers.project_id
    LEFT JOIN developers ON project_developers.developer_id = developers.id
    LEFT JOIN project_architects ON projects.id = project_architects.project_id
    LEFT JOIN architects ON project_architects.architect_id = architects.id
    LEFT JOIN project_contractors ON projects.id = project_contractors.project_id
    LEFT JOIN contractors ON project_contractors.contractor_id = contractors.id
    LEFT JOIN project_medias ON projects.id = project_medias.project_id
    LEFT JOIN source_links ON projects.id = source_links.project_id`;

export { projectsQueryString };
