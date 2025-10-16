const responseWrapper = require('../../utils/responseWrapper');
const { getErrorMessage } = require('../../utils/errorMessage');
const { Constants } = require('../../constants');
const ApplicationService = require('../../services/applications/application.service');

const respErrConstants = Constants.RESPONSES.ERROR_TEXTS;

const ApplicationController = {};

ApplicationController.create = async (req, res) => {
  try {
    const { name, organisationId, environmentIds, metadata } = req.body;
    
    if (!name || !organisationId || !environmentIds || environmentIds.length === 0) {
      return responseWrapper.errorResponse(
        res,
        400,
        'Name, organisation ID, and at least one environment ID are required'
      );
    }

    const application = await ApplicationService.createApplication({
      name,
      organisationId,
      environmentIds,
      metadata
    });

    return responseWrapper.successResponse(res, 201, application);
  } catch (error) {
    return responseWrapper.errorResponse(
      res,
      500,
      getErrorMessage(error) || respErrConstants.ERROR_500_MESSAGE,
      error
    );
  }
};

ApplicationController.list = async (req, res) => {
  try {
    const { organisationId } = req.query;
    
    let applications;
    if (organisationId) {
      applications = await ApplicationService.getApplicationsByOrganisation(organisationId);
    } else {
      applications = await ApplicationService.getAllApplications();
    }

    return responseWrapper.successResponse(res, 200, applications);
  } catch (error) {
    return responseWrapper.errorResponse(
      res,
      500,
      getErrorMessage(error) || respErrConstants.ERROR_500_MESSAGE,
      error
    );
  }
};

ApplicationController.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const application = await ApplicationService.getApplicationById(id);
    
    return responseWrapper.successResponse(res, 200, application);
  } catch (error) {
    if (error.message === 'Application not found') {
      return responseWrapper.errorResponse(res, 404, 'Application not found');
    }
    return responseWrapper.errorResponse(
      res,
      500,
      getErrorMessage(error) || respErrConstants.ERROR_500_MESSAGE,
      error
    );
  }
};

ApplicationController.getSecrets = async (req, res) => {
  try {
    const { applicationName, environmentName } = req.params;
    
    const secrets = await ApplicationService.getApplicationSecrets(applicationName, environmentName);
    
    return responseWrapper.successResponse(res, 200, secrets);
  } catch (error) {
    return responseWrapper.errorResponse(
      res,
      500,
      getErrorMessage(error) || respErrConstants.ERROR_500_MESSAGE,
      error
    );
  }
};

ApplicationController.getTags = async (req, res) => {
  try {
    const { applicationName, environmentName } = req.params;
    
    const tags = await ApplicationService.getApplicationTags(applicationName, environmentName);
    
    return responseWrapper.successResponse(res, 200, tags);
  } catch (error) {
    return responseWrapper.errorResponse(
      res,
      500,
      getErrorMessage(error) || respErrConstants.ERROR_500_MESSAGE,
      error
    );
  }
};

ApplicationController.updateSecrets = async (req, res) => {
  try {
    const { applicationName, environmentName } = req.params;
    const { secrets } = req.body;
    
    if (!secrets || !Array.isArray(secrets)) {
      return responseWrapper.errorResponse(
        res,
        400,
        'Secrets array is required'
      );
    }

    const result = await ApplicationService.updateApplicationSecrets(
      applicationName,
      environmentName,
      { secrets }
    );
    
    return responseWrapper.successResponse(res, 200, result);
  } catch (error) {
    return responseWrapper.errorResponse(
      res,
      500,
      getErrorMessage(error) || respErrConstants.ERROR_500_MESSAGE,
      error
    );
  }
};

ApplicationController.createTag = async (req, res) => {
  try {
    const { applicationName, environmentName } = req.params;
    const { name } = req.body;
    
    if (!name) {
      return responseWrapper.errorResponse(
        res,
        400,
        'Tag name is required'
      );
    }

    const tag = await ApplicationService.createTagForApplication(
      applicationName,
      environmentName,
      { name }
    );
    
    return responseWrapper.successResponse(res, 201, tag);
  } catch (error) {
    return responseWrapper.errorResponse(
      res,
      500,
      getErrorMessage(error) || respErrConstants.ERROR_500_MESSAGE,
      error
    );
  }
};

ApplicationController.deleteSecret = async (req, res) => {
  try {
    const { applicationName, environmentName } = req.params;
    const { secretKey } = req.body;
    
    if (!secretKey) {
      return responseWrapper.errorResponse(
        res,
        400,
        'Secret key is required'
      );
    }

    const result = await ApplicationService.deleteApplicationSecret(
      applicationName,
      environmentName,
      secretKey
    );
    
    return responseWrapper.successResponse(res, 200, result);
  } catch (error) {
    return responseWrapper.errorResponse(
      res,
      500,
      getErrorMessage(error) || respErrConstants.ERROR_500_MESSAGE,
      error
    );
  }
};

ApplicationController.getSecretVersions = async (req, res) => {
  try {
    const { applicationName, environmentName, tagName } = req.params;
    const { versionId } = req.query;
    
    let result;
    if (versionId) {
      // Get specific version's secret data
      result = await ApplicationService.getApplicationSecretVersionData(applicationName, environmentName, tagName, versionId);
    } else {
      // Get all versions list
      result = await ApplicationService.getApplicationSecretVersions(applicationName, environmentName, tagName);
    }
    
    return responseWrapper.successResponse(res, 200, result);
  } catch (error) {
    return responseWrapper.errorResponse(
      res,
      500,
      getErrorMessage(error) || respErrConstants.ERROR_500_MESSAGE,
      error
    );
  }
};

ApplicationController.revertSecret = async (req, res) => {
  try {
    const { applicationName, environmentName } = req.params;
    const revertData = req.body;
    
    const result = await ApplicationService.revertApplicationSecret(applicationName, environmentName, revertData);
    
    return responseWrapper.successResponse(res, 200, result);
  } catch (error) {
    return responseWrapper.errorResponse(
      res,
      500,
      getErrorMessage(error) || respErrConstants.ERROR_500_MESSAGE,
      error
    );
  }
};

ApplicationController.addEnvironment = async (req, res) => {
  try {
    const { applicationName } = req.params;
    const { environmentId } = req.body;
    
    if (!environmentId) {
      return responseWrapper.errorResponse(
        res,
        400,
        'Environment ID is required'
      );
    }

    const result = await ApplicationService.addEnvironmentToApplication(applicationName, environmentId);
    
    return responseWrapper.successResponse(res, 201, result);
  } catch (error) {
    if (error.message === 'Application not found') {
      return responseWrapper.errorResponse(res, 404, 'Application not found');
    }
    if (error.message === 'Environment not found') {
      return responseWrapper.errorResponse(res, 404, 'Environment not found');
    }
    if (error.message === 'Environment is already attached to this application') {
      return responseWrapper.errorResponse(res, 409, 'Environment is already attached to this application');
    }
    if (error.message === 'Environment does not belong to the same organization as the application') {
      return responseWrapper.errorResponse(res, 400, 'Environment does not belong to the same organization as the application');
    }
    return responseWrapper.errorResponse(
      res,
      500,
      getErrorMessage(error) || respErrConstants.ERROR_500_MESSAGE,
      error
    );
  }
};

ApplicationController.initializeSecrets = async (req, res) => {
  try {
    const { applicationName, environmentName } = req.params;
    
    const result = await ApplicationService.initializeEnvironmentSecrets(applicationName, environmentName);
    
    return responseWrapper.successResponse(res, 200, result);
  } catch (error) {
    if (error.message === 'Application not found') {
      return responseWrapper.errorResponse(res, 404, 'Application not found');
    }
    if (error.message === 'Environment not found for this application') {
      return responseWrapper.errorResponse(res, 404, 'Environment not found for this application');
    }
    return responseWrapper.errorResponse(
      res,
      500,
      getErrorMessage(error) || respErrConstants.ERROR_500_MESSAGE,
      error
    );
  }
};

module.exports = ApplicationController;
