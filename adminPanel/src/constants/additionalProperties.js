/** Predefined additional property keys for apartments - ensures consistent keys across all apartments */
export const ADDITIONAL_PROPERTY_KEYS = [
  {
    key: "checkInTime",
    label: "Час заїзду",
    type: "text",
    placeholder: "14:00",
    default: "14:00",
  },
  {
    key: "airConditioning",
    label: "Кондиціонер",
    type: "boolean",
    default: false,
  },
  {
    key: "elevator",
    label: "Ліфт",
    type: "boolean",
    default: false,
  },
  {
    key: "bathroomType",
    label: "Тип ванної (shower/bathtub)",
    type: "text",
    placeholder: "shower",
    default: "shower",
  },
  {
    key: "balcony",
    label: "Балкон",
    type: "boolean",
    default: false,
  },
  {
    key: "walkingMinutesToCenter",
    label: "Хвилини пішки до центру",
    type: "number",
    placeholder: 2,
    default: 2,
  },
];

export const getDefaultAdditionalProperties = () => {
  const obj = {};
  ADDITIONAL_PROPERTY_KEYS.forEach(({ key, default: def }) => {
    obj[key] = def;
  });
  return obj;
};

export const getAdditionalPropertiesFromRoom = (room) => {
  const existing = room?.additionalProperties || {};
  const result = getDefaultAdditionalProperties();
  ADDITIONAL_PROPERTY_KEYS.forEach(({ key }) => {
    if (existing[key] !== undefined) {
      result[key] = existing[key];
    }
  });
  return result;
};

export const getLabelForKey = (key) => {
  const found = ADDITIONAL_PROPERTY_KEYS.find((k) => k.key === key);
  return found ? found.label : key;
};
