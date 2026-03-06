const projectsQueryString = `SELECT projects.id, projects.name, 
    JSON_OBJECT(
      'id', addresses.id,
      'address', addresses.address,
      'cityId', addresses.city_id,
      'postcode', addresses.postcode,
      
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
      'email', developers.email,
      'source', project_developers.source
          )
        ), ']') AS developers,
    CONCAT('[', GROUP_CONCAT(DISTINCT
    JSON_OBJECT(
      'id', architects.id,
      'name', architects.name,
      'website', architects.website,
      'phone', architects.phone,
      'email', architects.email,
      'source', project_architects.source
          )
        ), ']') AS architects,
    CONCAT('[', GROUP_CONCAT(DISTINCT
    JSON_OBJECT(
      'id', contractors.id,
      'name', contractors.name,
      'website', contractors.website,
      'phone', contractors.phone,
      'email', contractors.email,
      'source', project_contractors.source
          )
        ), ']') AS contractors,
    CONCAT('[', GROUP_CONCAT(DISTINCT
    JSON_OBJECT(
      'id', consultants.id,
      'name', consultants.name,
      'website', consultants.website,
      'phone', consultants.phone,
      'email', consultants.email,
      'source', project_consultants.source
          )
        ), ']') AS consultants, 
    CONCAT('[', GROUP_CONCAT(DISTINCT
      JSON_OBJECT(
        'id', project_medias.id,
        'mediaType', project_medias.media_type,
        'url', project_medias.url,
        'title', project_medias.title,
        'filename', project_medias.filename,
        'sourcePage', project_medias.source_page
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
    ), ']') AS sourceLinks,
    projects.checked_by AS checkedBy, projects.checked_at AS checkedAt, MAX(checked_by_user.username) AS checkedByUsername,
    CONCAT('[', GROUP_CONCAT(DISTINCT
      JSON_OBJECT(
        'id',   fav_users.id,
        'username', fav_users.username
      )
    ), ']') AS favoritedByUsers
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
    LEFT JOIN project_consultants ON projects.id = project_consultants.project_id
    LEFT JOIN consultants ON project_consultants.consultant_id = consultants.id
    LEFT JOIN project_medias ON projects.id = project_medias.project_id
    LEFT JOIN source_links ON projects.id = source_links.project_id
    LEFT JOIN users AS checked_by_user ON projects.checked_by = checked_by_user.id
    LEFT JOIN users AS fav_users ON user_project_favorites.user_id = fav_users.id`;

const simpleProjectsQueryString = `SELECT
    projects.id, projects.name, projects.status,
    projects.expected_date_text AS expectedDateText,
    projects.expected_date AS expectedDate, projects.expected_date_text AS expectedDateText,
    projects.building_height_meters AS buildingHeightMeters,
    projects.building_height_floors AS buildingHeightFloors,
    projects.budget_eur AS budgetEur, projects.glass_facade AS glassFacade,
    projects.facade_basis AS facadeBasis, projects.confidence_score AS confidenceScore,
    projects.last_verified_date AS lastVerifiedDate, projects.is_active AS isActive,
    cities.name AS city, countries.name AS country, metro_areas.name AS metroArea,
    addresses.address AS address,
    building_types.building_type AS buildingType,
    CONCAT('[', GROUP_CONCAT(DISTINCT
      JSON_OBJECT(
        'id', building_uses.id,
        'buildingUse', building_uses.building_use
      )
    ), ']') AS buildingUses,
    CONCAT('[', GROUP_CONCAT(DISTINCT
      JSON_OBJECT(
        'id', project_medias.id,
        'url', project_medias.url
      ) ), ']') AS media,
    projects.checked_by AS checkedBy, projects.checked_at AS checkedAt, MAX(checked_by_user.username) AS checkedByUsername,
    CONCAT('[', GROUP_CONCAT(DISTINCT
      JSON_OBJECT(
        'id',   fav_users.id,
        'username', fav_users.username
      )
    ), ']') AS favoritedByUsers
    FROM projects
    JOIN addresses ON projects.address_id = addresses.id
    JOIN cities ON addresses.city_id = cities.id
    JOIN metro_areas ON cities.metro_area_id = metro_areas.id
    JOIN countries ON metro_areas.country_id = countries.id
    JOIN building_types ON projects.building_type_id = building_types.id
    LEFT JOIN project_building_uses ON projects.id = project_building_uses.project_id
    LEFT JOIN building_uses ON project_building_uses.building_use_id = building_uses.id
    LEFT JOIN project_medias ON projects.id = project_medias.project_id
    LEFT JOIN user_project_favorites ON projects.id = user_project_favorites.project_id
    LEFT JOIN users AS checked_by_user ON projects.checked_by = checked_by_user.id
    LEFT JOIN users AS fav_users ON user_project_favorites.user_id = fav_users.id`;

export { projectsQueryString, simpleProjectsQueryString };
