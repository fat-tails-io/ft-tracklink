export type JiraFieldDefinition = {
  id: string;
  key: string;
  name: string;
  schema?: {
    custom?: string;
    type?: string;
  };
};

/** Match a Forge `jira:customField` module to its Jira field metadata. */
export const matchFieldForModule = (
  fields: JiraFieldDefinition[],
  moduleKey: string,
): JiraFieldDefinition | undefined => {
  const staticSuffix = `/static/${moduleKey}`;
  return fields.find(
    (field) =>
      field.schema?.custom?.endsWith(staticSuffix) ||
      field.key.endsWith(`__${moduleKey}`) ||
      field.key.endsWith(`__${moduleKey.toUpperCase()}`),
  );
};

export const resolveFieldIdOrKey = (
  fields: JiraFieldDefinition[],
  moduleKey: string,
): string => {
  const field = matchFieldForModule(fields, moduleKey);
  if (!field) {
    throw new Error(
      `Jira custom field not found for Forge module "${moduleKey}". Redeploy the app and confirm the field exists on the site.`,
    );
  }
  return field.id;
};
