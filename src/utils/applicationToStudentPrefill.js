export function formatClassLabel(cls) {
  const section = cls.class_section || cls.stream || "";
  return `${cls.class_name}${section ? ` ${section}` : ""}`.trim();
}

export function matchClassId(classApplying, classes = []) {
  if (!classApplying || !classes.length) return "";
  const normalized = classApplying.trim().toLowerCase();

  const match = classes.find((cls) => {
    const labels = [
      formatClassLabel(cls),
      cls.class_name,
      `${cls.class_name}${cls.class_section ? ` - ${cls.class_section}` : ""}`,
      `${cls.class_name}${cls.stream ? ` - ${cls.stream}` : ""}`,
    ]
      .filter(Boolean)
      .map((v) => v.trim().toLowerCase());

    return labels.includes(normalized);
  });

  return match?.class_id || "";
}

function emptyGuardian(isPrimary = true) {
  return {
    id: `${Date.now()}-${Math.random()}`,
    guardianName: "",
    guardianRelationship: "",
    guardianPhone: "",
    guardianWhatsapp: "",
    guardianEmail: "",
    guardianAddress: "",
    guardianOccupation: "",
    isPrimary,
  };
}

export function buildStudentPrefillFromApplication(application, classes = []) {
  const data = application?.data || {};
  const files = application?.files || {};

  const form = {
    fullName: data.full_name || "",
    dateOfBirth: data.date_of_birth || "",
    gender: data.gender || "",
    email: data.email || data.guardian_email || "",
    phone: data.phone || "",
    whatsapp: data.whatsapp || "",
    religion: data.religion || "",
    nationality: data.nationality || "",
    stateOfOrigin: data.state_of_origin || "",
    placeOfBirth: data.place_of_birth || "",
    lgaOfOrigin: data.lga_of_origin || "",
    tribe: data.tribe || "",
    nin: data.nin || "",
    numberOfSiblings: data.number_of_siblings || "",
    familyPosition: data.family_position || "",
    livesWith: data.lives_with || "",
    bloodGroup: data.blood_group || "",
    genotype: data.genotype || "",
    houseNumberStreet: data.house_number_street || "",
    areaEstate: data.area_estate || data.address || "",
    city: data.city || "",
    lgaOfResidence: data.lga_of_residence || "",
    stateOfResidence: data.state_of_residence || "",
    landmark: data.landmark || "",
    emergencyContactName: data.emergency_contact_name || "",
    emergencyContactPhone: data.emergency_contact_phone || "",
    emergencyContactWhatsapp: data.emergency_contact_whatsapp || "",
    emergencyContactRelationship: data.emergency_contact_relationship || "",
  };

  const guardians = [];

  if (data.guardian_name || data.guardian_phone || data.guardian_email) {
    guardians.push({
      ...emptyGuardian(true),
      guardianName: data.guardian_name || "",
      guardianRelationship: data.guardian_relationship || "",
      guardianPhone: data.guardian_phone || "",
      guardianWhatsapp: data.guardian_whatsapp || "",
      guardianEmail: data.guardian_email || "",
      guardianAddress: data.guardian_address || "",
      guardianOccupation: data.guardian_occupation || "",
    });
  }

  if (data.second_guardian_name || data.second_guardian_phone || data.second_guardian_email) {
    guardians.push({
      ...emptyGuardian(false),
      guardianName: data.second_guardian_name || "",
      guardianPhone: data.second_guardian_phone || "",
      guardianEmail: data.second_guardian_email || "",
    });
  }

  if (!guardians.length) {
    guardians.push(emptyGuardian(true));
  }

  return {
    form,
    guardians,
    selectedClassId: matchClassId(data.class_applying, classes),
    photoUrl: files.student_photo?.url || null,
    applicationId: application.application_id,
  };
}
