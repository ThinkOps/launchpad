import { httpClient, APPLICATIONS_URL, APPLICATION_BY_ID_URL, APPLICATION_SECRETS_URL, APPLICATION_TAGS_URL } from "../config/api";

export const createApplication = async (data) => {
  return httpClient.post({
    url: APPLICATIONS_URL,
    data: {
      name: data.name,
      organisationId: data.organisationId,
      environmentIds: data.environmentIds,
      metadata: data.metadata
    },
    token: true
  });
};

export const getApplications = async (organisationId = null) => {
  const params = organisationId ? `?organisationId=${organisationId}` : '';
  return httpClient.get({ 
    url: `${APPLICATIONS_URL}${params}`, 
    token: true 
  });
};

export const getApplicationById = async (id) => {
  return httpClient.get({ 
    url: APPLICATION_BY_ID_URL(id), 
    token: true 
  });
};

export const getApplicationSecrets = async (applicationName, environmentName) => {
  return httpClient.get({ 
    url: APPLICATION_SECRETS_URL(applicationName, environmentName), 
    token: true 
  });
};

export const getApplicationTags = async (applicationName, environmentName) => {
  return httpClient.get({ 
    url: APPLICATION_TAGS_URL(applicationName, environmentName), 
    token: true 
  });
};

export const updateApplicationSecrets = async (applicationName, environmentName, secretsData) => {
  return httpClient.put({
    url: APPLICATION_SECRETS_URL(applicationName, environmentName),
    data: secretsData,
    token: true
  });
};

export const createTagForApplication = async (applicationName, environmentName, tagData) => {
  return httpClient.post({
    url: APPLICATION_TAGS_URL(applicationName, environmentName),
    data: tagData,
    token: true
  });
};

export const deleteApplicationSecret = async (applicationName, environmentName, secretKey) => {
  return httpClient.delete({
    url: APPLICATION_SECRETS_URL(applicationName, environmentName),
    data: { secretKey },
    token: true
  });
};

export const getVersionOfApplicationSecret = async (applicationName, environmentName, tagName, versionId = null) => {
  const url = `${APPLICATIONS_URL}/${applicationName}/environments/${environmentName}/tags/${tagName}/versions`;
  const params = versionId ? `?versionId=${versionId}` : '';
  return httpClient.get({ 
    url: `${url}${params}`, 
    token: true 
  });
};

export const revertApplicationSecret = async (applicationName, environmentName, revertData) => {
  return httpClient.post({
    url: `${APPLICATIONS_URL}/${applicationName}/environments/${environmentName}/revert`,
    data: revertData,
    token: true
  });
};

export const addEnvironmentToApplication = async (applicationName, environmentId) => {
  return httpClient.post({
    url: `${APPLICATIONS_URL}/${applicationName}/environments`,
    data: { environmentId },
    token: true
  });
};

export const initializeEnvironmentSecrets = async (applicationName, environmentName) => {
  return httpClient.post({
    url: `${APPLICATIONS_URL}/${applicationName}/environments/${environmentName}/secrets/initialize`,
    data: {},
    token: true
  });
};
