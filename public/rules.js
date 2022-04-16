/**
 * validate rules for HC1
 * @param {JSON} json 
 * @returns 
 * if true --> returns [true]
 * if false --> returns [false, ERROR_TITLE, ERROR_MSG]
 */
function validateRules(json) {
  var now = moment(new Date()); //todays date
  if ("t" in json) { // Test reports
    json = json['t'][0]
    // check for positive result
    if (json['tr'] === "260373001") {
      if (json['tt'] === "LP6464-4") {
        return [false, ERROR_TITLE_NOT_VALID, T_ERROR_MSG_72];
      } else if (json['tt'] === "LP217198-3") {
        return [false, ERROR_TITLE_NOT_VALID, T_ERROR_MSG_48];
      } else {
        return [false, ERROR_TITLE_NOT_VALID, ""];
      }
    } else if (json['tr'] === "260415000") {
      if (json['tt'] === "LP6464-4") {
        validHours = 72;
      } else if (json['tt'] === "LP217198-3") { // 
        validHours = 48;
      } else {
        return [false, ERROR_TITLE_NOT_VALID, ""];
      }
      var sc = moment(json['sc'])
      // sc + validHours < now --> invalid
      if (now.subtract(validHours, "hours").isAfter(sc)) {
        if (validHours === 72) {
          return [false, ERROR_TITLE_EXPIRED, T_ERROR_MSG_72];
        } else { // 48 hours
          return [false, ERROR_TITLE_EXPIRED, T_ERROR_MSG_48];
        }
      }
      return [true];
    } else {
      return [false, ERROR_TITLE_NOT_VALID, ""];
    }
  } else if ("v" in json) { // Vaccination
    json = json['v'][0]
    const isBoosterDose = (json['dn'] > json['sd'] && json['sd'] == 1) || (json['dn'] == json['sd'] && json['sd'] > 2)
    if (json['mp'] !== "EU/1/20/1528" && json['mp'] !== "EU/1/20/1507" && json['mp'] !== "EU/1/20/1525" && json['mp'] !== "EU/1/21/1529" &&
      json['mp'] !== "CoronaVac" && json['mp'] !== "BBIBP-CorV" && json['mp'] !== "Covishield") {
      return [false, ERROR_TITLE_NOT_VALID, V_ERROR_MSG_NOT_AUTHORISED_IN_IR]
    }
    var dt = moment(json['dt'], "YYYY-MM-DD");
    // Vaccination with booster - valid immediately without any expiry
    if (isBoosterDose) {
      return [true]
    }
    if (moment(now).subtract(365, "days").isAfter(dt) && 
      moment(now).isBefore(moment("2022-02-01", "YYYY-MM-DD"))
    ) {
      return [false, ERROR_TITLE_NOT_VALID, V_ERROR_MSG_365_DAYS_NOT_VALID_PRIMARY]
    } else if (moment(now).subtract(270, "days").isAfter(dt) &&
      moment(now).isSameOrAfter(moment("2022-02-01", "YYYY-MM-DD"))
    ) {
      return [false, ERROR_TITLE_NOT_VALID, V_ERROR_MSG_270_DAYS_NOT_VALID_PRIMARY]
    } else if (json['mp'] === "EU/1/20/1528") { // Pfizer-BioNTech dose
      if (now.subtract(7, "days").isBefore(dt) || json['dn'] < json['sd']) {
        return [false, ERROR_TITLE_NOT_VALID_AS_OF_NOW, V_ERROR_MSG_PFIZER]
      }
    } else if (json['mp'] === "EU/1/20/1507") { // Moderna dose
      if (now.subtract(14, 'days').isBefore(dt) || json['dn'] < json['sd']) {
        return [false, ERROR_TITLE_NOT_VALID_AS_OF_NOW, V_ERROR_MSG_MODERNA]
      }
    } else if (json['mp'] === "EU/1/20/1525") { // Janssen vaccine
      if (now.subtract(14, 'days').isBefore(dt) || json['dn'] < json['sd']) {
        return [false, ERROR_TITLE_NOT_VALID_AS_OF_NOW, V_ERROR_MSG_JANSSEN]
      }
    } else if (json['mp'] === "EU/1/21/1529") { // AstraZeneca dose
      if (now.subtract(15, 'days').isBefore(dt) || json['dn'] < json['sd']) {
        return [false, ERROR_TITLE_NOT_VALID_AS_OF_NOW, V_ERROR_MSG_ASTRA_ZENECA]
      }
    } else if (json['mp'] === "CoronaVac") { // Sinovac dose
      if (now.subtract(14, 'days').isBefore(dt) || json['dn'] < json['sd']) {
        return [false, ERROR_TITLE_NOT_VALID_AS_OF_NOW, V_ERROR_MSG_SINOVAC]
      }
    } else if (json['mp'] === "BBIBP-CorV") { // Sinopharm
      if (now.subtract(14, 'days').isBefore(dt) || json['dn'] < json['sd']) {
        return [false, ERROR_TITLE_NOT_VALID_AS_OF_NOW, V_ERROR_MSG_SINOPHARM]
      }
    } else if (json['mp'] === "Covishield") { // Covishield
      if (now.subtract(15, 'days').isBefore(dt) || json['dn'] < json['sd']) {
        return [false, ERROR_TITLE_NOT_VALID_AS_OF_NOW, V_ERROR_MSG_COVISHIELD]
      }
    }
    return [true];
  } else if ("r" in json) { // Recovery
    json = json['r'][0]
    var frStart = moment(json['fr'], "YYYY-MM-DD").add(11, 'days');
    var frEnd = moment(json['fr'], "YYYY-MM-DD").add(181, 'days');
    if (now.isBefore(frStart)) {
      return [false, ERROR_TITLE_NOT_VALID, R_ERROR_MSG_NOT_VALID];
    } else if (now.isAfter(frEnd)) {
      return [false, ERROR_TITLE_EXPIRED, R_ERROR_MSG_EXPIRED];
    }
    return [true]
  }
  return [false, GENERIC_ERROR_TITLE, GENERIC_ERROR_MSG];
}

/**
 * show result for HC1
 * @param {*} json 
 * @returns 
 */
function shownResult(json) {
  var certType, certDate, certDateKey, country;
  if ("t" in json) { // Test reports
    country = json['t'][0]['co'];
    if (country === "NO") {
      country = "Norway";
    }
    if (json['t'][0]['tt'] === "LP6464-4") {
      certType = `Test (RT-PCR) - ${country}`;
    } else {
      certType = `Test (Antigen) - ${country}`;
    }
    certDate = json['t'][0]['sc'].substring(0, 10);
    certDateKey = "Test Date";
  } else if ("v" in json) { // Vaccination
    country = json['v'][0]['co'];
    if (country === "NO") {
      country = "Norway";
    }
    certType = `Vaccination - ${country}`;
    certDate = json['v'][0]['dt']
    certDateKey = "Vaccination Date";
  } else { // Recovery
    country = json['r'][0]['co'];
    if (country === "NO") {
      country = "Norway";
    }
    certType = `Recovery - ${country}`;
    certDate = moment(json['r'][0]['fr'], "YYYY-MM-DD").add(11, 'days').format("YYYY-MM-DD");
    certDateKey = "Recovery Date";
  }
  var shownResult = {
    "Name": "",
    // "Year of Birth": json['dob'].substring(0, 4),
    "Cert Type": certType
  }
  if ('fn' in json['nam'] || 'gn' in json['nam']) {
    var displayName = `${'gn' in json['nam'] ? json['nam']['gn'] : ""} ${'fn' in json['nam'] ? json['nam']['fn'] : ""}`
    shownResult['Name'] = displayName.trim();
  } else {
    var displayName = `${'gnt' in json['nam'] ? json['nam']['gnt'] : ""} ${json['nam']['fnt']}`
    shownResult['Name'] = displayName.trim();
  }
  shownResult[certDateKey] = certDate;
  return shownResult;
}

/**
 * validate rules for shc
 * @param {JSON} json 
 * @returns 
 * if true --> returns [true]
 * if false --> returns [false, ERROR_TITLE, ERROR_MSG]
 */
function validateRulesShc(json) {
  var now = moment(new Date()); //todays date
  const recognisedVaccineCodes = ["207", "208", "210", "212", "510", "511"]
  var resource1 = null;
  var resource2 = null;
  var vaccineCode = "";
  json['vc']['credentialSubject']['fhirBundle']['entry'].forEach(data => {
    if (data['fullUrl'] === "resource:1") {
      resource1 = data['resource'];
      vaccineCode = data['resource']['vaccineCode']['coding'][0]['code']
    } else if (data['fullUrl'] === "resource:2") {
      resource2 = data['resource'];
      vaccineCode = data['resource']['vaccineCode']['coding'][0]['code']
    }
  })
  if (!recognisedVaccineCodes.includes(vaccineCode)) {
    return [false, ERROR_TITLE_NOT_VALID, V_ERROR_MSG_NOT_AUTHORISED_IN_IR]
  }
  if (json['nbf'] > now.unix()) {
    return [false, ERROR_TITLE_NOT_VALID_AS_OF_NOW, ""]
  }
  if (
    (resource1 !== null && (
      resource1['resourceType'] !== "Immunization" ||
      resource1['status'] !== "completed"
    )) ||
    (resource2 !== null && (
      resource2['resourceType'] !== "Immunization" ||
      resource2['status'] !== "completed"
    ))
  ) {
    return [false, ERROR_TITLE_NOT_VALID, ""]
  }
  if (vaccineCode === "208") { // Pfizer
    if (resource1 === null || resource2 === null) {
      return [false, ERROR_TITLE_NOT_VALID_AS_OF_NOW, V_ERROR_MSG_PFIZER]
    }
    var dt = moment(resource2['occurrenceDateTime'], "YYYY-MM-DD");
    if (moment(now).subtract(365, "days").isAfter(dt)) {
      return [false, ERROR_TITLE_NOT_VALID, V_ERROR_MSG_365_DAYS_NOT_VALID]
    } else if (moment(now).subtract(7, "days").isBefore(dt)) {
      return [false, ERROR_TITLE_NOT_VALID_AS_OF_NOW, V_ERROR_MSG_PFIZER]
    }
  } else if (vaccineCode === "207") { // moderna
    if (resource1 === null || resource2 === null) {
      return [false, ERROR_TITLE_NOT_VALID_AS_OF_NOW, V_ERROR_MSG_MODERNA]
    }
    var dt = moment(resource2['occurrenceDateTime'], "YYYY-MM-DD");
    if (moment(now).subtract(365, "days").isAfter(dt)) {
      return [false, ERROR_TITLE_NOT_VALID, V_ERROR_MSG_365_DAYS_NOT_VALID]
    } else if (moment(now).subtract(14, "days").isBefore(dt)) {
      return [false, ERROR_TITLE_NOT_VALID_AS_OF_NOW, V_ERROR_MSG_MODERNA]
    }
  } else if (vaccineCode === "212") { // janssen
    if (resource1 === null) {
      return [false, ERROR_TITLE_NOT_VALID_AS_OF_NOW, V_ERROR_MSG_JANSSEN]
    }
    var dt = moment(resource1['occurrenceDateTime'], "YYYY-MM-DD");
    if (moment(now).subtract(365, "days").isAfter(dt)) {
      return [false, ERROR_TITLE_NOT_VALID, V_ERROR_MSG_365_DAYS_NOT_VALID]
    } else if (moment(now).subtract(14, "days").isBefore(dt)) {
      return [false, ERROR_TITLE_NOT_VALID_AS_OF_NOW, V_ERROR_MSG_JANSSEN]
    }
  } else if (vaccineCode === "210") { // Astra Zeneca
    if (resource1 === null || resource2 === null) {
      return [false, ERROR_TITLE_NOT_VALID_AS_OF_NOW, V_ERROR_MSG_ASTRA_ZENECA]
    }
    var dt = moment(resource2['occurrenceDateTime'], "YYYY-MM-DD");
    if (moment(now).subtract(365, "days").isAfter(dt)) {
      return [false, ERROR_TITLE_NOT_VALID, V_ERROR_MSG_365_DAYS_NOT_VALID]
    } else if (moment(now).subtract(15, "days").isBefore(dt)) {
      return [false, ERROR_TITLE_NOT_VALID_AS_OF_NOW, V_ERROR_MSG_ASTRA_ZENECA]
    }
  } else if (vaccineCode === "510") { // Sinopharm
    if (resource1 === null || resource2 === null) {
      return [false, ERROR_TITLE_NOT_VALID_AS_OF_NOW, V_ERROR_MSG_SINOPHARM]
    }
    var dt = moment(resource2['occurrenceDateTime'], "YYYY-MM-DD");
    if (moment(now).subtract(365, "days").isAfter(dt)) {
      return [false, ERROR_TITLE_NOT_VALID, V_ERROR_MSG_365_DAYS_NOT_VALID]
    } else if (moment(now).subtract(14, "days").isBefore(dt)) {
      return [false, ERROR_TITLE_NOT_VALID_AS_OF_NOW, V_ERROR_MSG_SINOPHARM]
    }
  } else if (vaccineCode === "511") { // Sinovac
    if (resource1 === null || resource2 === null) {
      return [false, ERROR_TITLE_NOT_VALID_AS_OF_NOW, V_ERROR_MSG_SINOVAC]
    }
    var dt = moment(resource2['occurrenceDateTime'], "YYYY-MM-DD");
    if (moment(now).subtract(365, "days").isAfter(dt)) {
      return [false, ERROR_TITLE_NOT_VALID, V_ERROR_MSG_365_DAYS_NOT_VALID]
    } else if (moment(now).subtract(14, "days").isBefore(dt)) {
      return [false, ERROR_TITLE_NOT_VALID_AS_OF_NOW, V_ERROR_MSG_SINOVAC]
    }
  }
  return [true]
}

/**
 * show result for shc
 * @param {*} json 
 * @returns 
 */
function shownResultShc(json, countryCode) {
  var patient = null;
  var latest = 0;
  var occurrenceDateTime = null
  json['vc']['credentialSubject']['fhirBundle']['entry'].forEach(data => {
    if (data['fullUrl'] === "resource:0") {
      patient = data['resource']
    } else if (data['fullUrl'] === "resource:1" && latest < 1) {
      latest = 1
      occurrenceDateTime = data['resource']['occurrenceDateTime']
    } else if (data['fullUrl'] === "resource:2" && latest < 2) {
      latest = 2
      occurrenceDateTime = data['resource']['occurrenceDateTime']
    }
  })
  if (patient === null) {
    return {}
  }
  var shownResult = {
    "Name": `${patient['name'][0]['given'].join(" ")} ${patient['name'][0]['family']}`,
    "Cert Type": `Vaccination - ${countryCode}`,
  }
  if (occurrenceDateTime !== null) {
    shownResult["Vaccination Date"] = occurrenceDateTime;
  }
  return shownResult;
}

/**
 * validate rules for C02 (Cert Type Exempt - IE)
 * @param {JSON} json 
 * @returns 
 * if true --> returns [true]
 * if false --> returns [false, ERROR_TITLE, ERROR_MSG]
 */
function validateRulesC02(json) {
  const certTypeKey = "Cert Type"
  const validatedCertType = "Exempt - IE"
  var content = json['content']
  var result = false;
  content.map(data => {
    if (data['t'] === "t2" && data['c'][0].trim() === certTypeKey && data['c'][1].trim() === validatedCertType) {
      result = true;
    }
  })
  if (result) {
    return [true]
  } else {
    return [false, GENERIC_ERROR_TITLE, GENERIC_ERROR_MSG]
  }
}

/**
 * show result for C02 (Cert Type Exempt - IE)
 * @param {*} json 
 * @returns 
 */
function shownResultC02(json) {
  // const
  const nameKey = "Name"
  const certTypeKey = "Cert Type"
  const dateKey = "Date"

  var content = json['content']
  var name = ""
  var certType = ""
  var date = ""
  content.map(data => {
    if (data['t'] === "t2") {
      if (data['c'][0].trim() === nameKey) {
        name = data['c'][1]
      } else if (data['c'][0].trim() === certTypeKey) {
        certType = data['c'][1]
      } else if (data['c'][0].trim() === dateKey) {
        date = data['c'][1]
      }
    }
  })
  var shownResult = {
    "Name": name,
    "Cert Type": certType,
    "Date": date
  }
  return shownResult
}

const ERROR_TITLE_EXPIRED = "Sorry, this certificate has now expired."
const ERROR_TITLE_NOT_VALID = "Sorry, this certificate is not valid."
const ERROR_TITLE_NOT_VALID_AS_OF_NOW = "Sorry, this certificate is not valid as of now."

// Test
const T_ERROR_MSG_72 = "Negative Test certs based on RT-PCR tests are valid for 72 hours for EU Travel"
const T_ERROR_MSG_48 = "Negative Test certs based on rapid antigen tests (RADT) are valid for 48 hours for EU Travel"

// Recovery
const R_ERROR_MSG_EXPIRED = "Recovery certs are valid for 180 days from the test positive date."
const R_ERROR_MSG_NOT_VALID = "Recovery certs are valid only after 11 days from the test positive date"

// Vaccination
const V_ERROR_MSG_PFIZER = "You are fully vaccinated 7 days after your second Pfizer-BioNTech(Comirnaty) dose"
const V_ERROR_MSG_MODERNA = "You are fully vaccinated 14 days after your second Spikevax(Moderna) dose"
const V_ERROR_MSG_JANSSEN = "You are fully vaccinated 14 days after the Janssen (Johnson & Johnson) vaccine - this is a single dose vaccine"
const V_ERROR_MSG_ASTRA_ZENECA = "You are fully vaccinated 15 days after your second Vaxzevria(AstraZeneca)/Covishield dose"
const V_ERROR_MSG_SINOVAC = "You are fully vaccinated 14 days after your second Sinovac(Coronavac) dose"
const V_ERROR_MSG_SINOPHARM = "You are fully vaccinated 14 days after your second Sinopharm BIBP(BBIBP-CorV) dose"
const V_ERROR_MSG_COVISHIELD = "You are fully vaccinated 15 days after your second Vaxzevria(AstraZeneca)/Covishield dose"
const V_ERROR_MSG_NOT_AUTHORISED_IN_IR = "This vaccination certificate is not authorised for its use in Ireland"
const V_ERROR_MSG_365_DAYS_NOT_VALID = "This vaccination certificate is valid for 365 days from the date of vaccination"
const V_ERROR_MSG_365_DAYS_NOT_VALID_PRIMARY = "This vaccination certificate is valid for 365 days from the date of the latest primary vaccination dose."
const V_ERROR_MSG_270_DAYS_NOT_VALID_PRIMARY = "This vaccination certificate is valid for 270 days from the date of the latest primary vaccination dose."

// Generic Error Msg
const GENERIC_ERROR_TITLE = "Sorry this certificate cannot be validated"
const GENERIC_ERROR_MSG = "Unable to validate this Code. Please contact the issuing organisation"

// Not HC1 Code Error Msg
const NOT_HC1_ERROR_TITLE = "No Digital Covid Certificate QR code found. Please try again."
// Camera permission error msg
const CAMERA_PERMISSION_ERROR_TITLE = "Camera Permission is required to scan QR Codes"

// 2 minutes timeout to cleanup result data
const USE_RESULT_TIMEOUT = true;
const RESULT_TIMEOUT = "120000" // miliseconds

// lists of endpoints
const EP_CLICK_SCAN_QR_CODE = "/fe/Button/"
const EP_CAMERA_LOADS = "/fe/Camera/"
const EP_CAMERA_30 = "/fe/Camera30/"
const EP_CAMERA_60 = "/fe/Camera60/"
const EP_CAMERA_PERMISSION_NOT_GIVEN = "/fe/CameraPermissionNotGiven/"
const EP_NOT_HC1_CODE = "/fe/NotHC1code/"