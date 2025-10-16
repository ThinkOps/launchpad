const { getErrorMessage } = require("../../utils/errorMessage");
const responseWrapper = require("../../utils/responseWrapper");
const userService = require('../../services/user/user.service'); 
const { Constants } = require('../../constants');
const respErrConstants = Constants.RESPONSES.ERROR_TEXTS;

const UserController = {};

UserController.getAllUsers = async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    return responseWrapper.successResponse(
      res,
      200,
      users
    );
  } catch (error) {
    return responseWrapper.errorResponse(
      res,
      500,
      getErrorMessage(error) || respErrConstants.ERROR_500_MESSAGE,
      error
    );
  }
};

UserController.searchUsersByEmail = async (req, res) => {
  try {
    const { searchTerm } = req.query;
    const users = await userService.getUsersByEmail(searchTerm);
    return responseWrapper.successResponse(res, 200, users);
  } catch (error) {
    return responseWrapper.errorResponse(
      res,
      500,
      getErrorMessage(error) || respErrConstants.ERROR_500_MESSAGE,
      error
    );
  }
};

UserController.getUserTeamsAndRoles = async (req, res) => {
  try {
    const userId = req.user.id; // Get user ID from JWT token
    const userTeamsAndRoles = await userService.getUserTeamsAndRoles(userId);
    return responseWrapper.successResponse(res, 200, userTeamsAndRoles);
  } catch (error) {
    return responseWrapper.errorResponse(
      res,
      500,
      getErrorMessage(error) || respErrConstants.ERROR_500_MESSAGE,
      error
    );
  }
};

module.exports = UserController;
