const responseWrapper = require('../../utils/responseWrapper');
const { getErrorMessage } = require('../../utils/errorMessage');
const { Constants } = require('../../constants');
const RoleService = require('../../services/roles/role.service');

const respErrConstants = Constants.RESPONSES.ERROR_TEXTS;

const RoleController = {};

RoleController.create = async (req, res) => {
  try {
    const { name } = req.body;
    const created = await RoleService.create({ name });
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

RoleController.list = async (req, res) => {
  try {
    const roles = await RoleService.list();
    return responseWrapper.successResponse(res, 200, roles);
  } catch (error) {
    return responseWrapper.errorResponse(
      res,
      500,
      getErrorMessage(error) || respErrConstants.ERROR_500_MESSAGE,
      error
    );
  }
};

RoleController.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const role = await RoleService.getById(id);
    return responseWrapper.successResponse(res, 200, role);
  } catch (error) {
    const statusCode = error.message === 'Role not found' ? 404 : 500;
    return responseWrapper.errorResponse(
      res,
      statusCode,
      getErrorMessage(error) || respErrConstants.ERROR_500_MESSAGE,
      error
    );
  }
};

RoleController.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const updated = await RoleService.update(id, { name });
    return responseWrapper.successResponse(res, 200, updated);
  } catch (error) {
    const statusCode = error.message === 'Role not found' ? 404 : 500;
    return responseWrapper.errorResponse(
      res,
      statusCode,
      getErrorMessage(error) || respErrConstants.ERROR_500_MESSAGE,
      error
    );
  }
};

RoleController.remove = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await RoleService.remove(id);
    return responseWrapper.successResponse(res, 200, result);
  } catch (error) {
    const statusCode = error.message === 'Role not found' ? 404 : 500;
    return responseWrapper.errorResponse(
      res,
      statusCode,
      getErrorMessage(error) || respErrConstants.ERROR_500_MESSAGE,
      error
    );
  }
};

module.exports = RoleController;

