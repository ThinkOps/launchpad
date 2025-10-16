const responseWrapper = require('../../utils/responseWrapper');
const { getErrorMessage } = require('../../utils/errorMessage');
const { Constants } = require('../../constants');
const OrgService = require('../../services/organisations/organisations.service');

const respErrConstants = Constants.RESPONSES.ERROR_TEXTS;

const OrgController = {};

OrgController.create = async (req, res) => {
  try {
    const { name } = req.body;
    const created = await OrgService.create({ name });
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

OrgController.list = async (req, res) => {
  try {
    const orgs = await OrgService.list();
    return responseWrapper.successResponse(res, 200, orgs);
  } catch (error) {
    return responseWrapper.errorResponse(
      res,
      500,
      getErrorMessage(error) || respErrConstants.ERROR_500_MESSAGE,
      error
    );
  }
};

OrgController.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const org = await OrgService.getById(id);
    if (!org) {
      return responseWrapper.errorResponse(res, 404, 'Organisation not found');
    }
    return responseWrapper.successResponse(res, 200, org);
  } catch (error) {
    return responseWrapper.errorResponse(
      res,
      500,
      getErrorMessage(error) || respErrConstants.ERROR_500_MESSAGE,
      error
    );
  }
};

OrgController.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const existing = await OrgService.getById(id);
    if (!existing) {
      return responseWrapper.errorResponse(res, 404, 'Organisation not found');
    }
    const updated = await OrgService.update(id, { name });
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

OrgController.remove = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await OrgService.getById(id);
    if (!existing) {
      return responseWrapper.errorResponse(res, 404, 'Organisation not found');
    }
    await OrgService.remove(id);
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

module.exports = OrgController;

