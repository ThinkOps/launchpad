const responseWrapper = require('../../utils/responseWrapper');
const { getErrorMessage } = require('../../utils/errorMessage');
const { Constants } = require('../../constants');
const CloudAccountService = require('../../services/cloudAccounts/cloudAccount.service');

const respErrConstants = Constants.RESPONSES.ERROR_TEXTS;

const CloudAccountController = {};

CloudAccountController.create = async (req, res) => {
  try {
    const { provider, account_name, account_identifier, access_keys, metadata } = req.body;
    const { orgId } = req.params;
    const created = await CloudAccountService.create({
      provider,
      account_name,
      account_identifier,
      organisation_id: orgId,
      access_keys,
      metadata,
    });
    
    return responseWrapper.successResponse(res, 201, created);
  } catch (error) {
    return responseWrapper.errorResponse(
      res,
      500,
      getErrorMessage(error) || respErrConstants.ERROR_500_MESSAGE,
      error
    );
  }
};

CloudAccountController.list = async (req, res) => {
  try {
    const cloudAccounts = await CloudAccountService.list();
    return responseWrapper.successResponse(res, 200, cloudAccounts);
  } catch (error) {
    return responseWrapper.errorResponse(
      res,
      500,
      getErrorMessage(error) || respErrConstants.ERROR_500_MESSAGE,
      error
    );
  }
};

CloudAccountController.listByOrganisation = async (req, res) => {
  try {
    const { orgId } = req.params;
    const cloudAccounts = await CloudAccountService.listByOrganisationId(orgId);
    return responseWrapper.successResponse(res, 200, cloudAccounts);
  } catch (error) {
    return responseWrapper.errorResponse(
      res,
      500,
      getErrorMessage(error) || respErrConstants.ERROR_500_MESSAGE,
      error
    );
  }
};

CloudAccountController.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const cloudAccount = await CloudAccountService.getById(id);
    
    if (!cloudAccount) {
      return responseWrapper.errorResponse(res, 404, 'Cloud account not found');
    }
    
    return responseWrapper.successResponse(res, 200, cloudAccount);
  } catch (error) {
    return responseWrapper.errorResponse(
      res,
      500,
      getErrorMessage(error) || respErrConstants.ERROR_500_MESSAGE,
      error
    );
  }
};

CloudAccountController.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { provider, account_name, account_identifier, access_keys, metadata } = req.body;
    
    const existing = await CloudAccountService.getById(id);
    if (!existing) {
      return responseWrapper.errorResponse(res, 404, 'Cloud account not found');
    }
    
    const updated = await CloudAccountService.update(id, {
      provider,
      account_name,
      account_identifier,
      access_keys,
      metadata,
    });
    
    return responseWrapper.successResponse(res, 200, updated);
  } catch (error) {
    return responseWrapper.errorResponse(
      res,
      500,
      getErrorMessage(error) || respErrConstants.ERROR_500_MESSAGE,
      error
    );
  }
};

CloudAccountController.remove = async (req, res) => {
  try {
    const { id } = req.params;
    
    const existing = await CloudAccountService.getById(id);
    if (!existing) {
      return responseWrapper.errorResponse(res, 404, 'Cloud account not found');
    }
    
    await CloudAccountService.remove(id);
    return res.status(204).send();
  } catch (error) {
    return responseWrapper.errorResponse(
      res,
      500,
      getErrorMessage(error) || respErrConstants.ERROR_500_MESSAGE,
      error
    );
  }
};

CloudAccountController.testConnection = async (req, res) => {
  try {
    const { provider, access_keys } = req.body;
    
    if (!provider || !access_keys) {
      return responseWrapper.errorResponse(res, 400, 'Provider and access_keys are required');
    }
    
    const result = await CloudAccountService.testConnection({
      provider,
      access_keys
    });
    
    // Return success response regardless of connection test result
    // The result object contains success/failure information
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

CloudAccountController.listVpcs = async (req, res) => {
  try {
    const { id } = req.params;
    
    const cloudAccount = await CloudAccountService.getById(id);
    if (!cloudAccount) {
      return responseWrapper.errorResponse(res, 404, 'Cloud account not found');
    }
    
    const vpcs = await CloudAccountService.listVpcs(id);
    return responseWrapper.successResponse(res, 200, vpcs);
  } catch (error) {
    return responseWrapper.errorResponse(
      res,
      500,
      getErrorMessage(error) || respErrConstants.ERROR_500_MESSAGE,
      error
    );
  }
};

module.exports = CloudAccountController;
