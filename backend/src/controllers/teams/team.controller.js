const responseWrapper = require('../../utils/responseWrapper');
const { getErrorMessage } = require('../../utils/errorMessage');
const { Constants } = require('../../constants');
const TeamService = require('../../services/teams/team.service');

const respErrConstants = Constants.RESPONSES.ERROR_TEXTS;

const TeamController = {};

TeamController.create = async (req, res) => {
  try {
    const { name, email } = req.body;
    const created = await TeamService.create({ name, email });
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

TeamController.list = async (req, res) => {
  try {
    const teams = await TeamService.list();
    return responseWrapper.successResponse(res, 200, teams);
  } catch (error) {
    return responseWrapper.errorResponse(
      res,
      500,
      getErrorMessage(error) || respErrConstants.ERROR_500_MESSAGE,
      error
    );
  }
};

TeamController.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const team = await TeamService.getById(id);
    return responseWrapper.successResponse(res, 200, team);
  } catch (error) {
    const statusCode = error.message === 'Team not found' ? 404 : 500;
    return responseWrapper.errorResponse(
      res,
      statusCode,
      getErrorMessage(error) || respErrConstants.ERROR_500_MESSAGE,
      error
    );
  }
};

TeamController.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email } = req.body;
    const updated = await TeamService.update(id, { name, email });
    return responseWrapper.successResponse(res, 200, updated);
  } catch (error) {
    const statusCode = error.message === 'Team not found' ? 404 : 500;
    return responseWrapper.errorResponse(
      res,
      statusCode,
      getErrorMessage(error) || respErrConstants.ERROR_500_MESSAGE,
      error
    );
  }
};

TeamController.remove = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await TeamService.remove(id);
    return responseWrapper.successResponse(res, 200, result);
  } catch (error) {
    const statusCode = error.message === 'Team not found' ? 404 : 500;
    return responseWrapper.errorResponse(
      res,
      statusCode,
      getErrorMessage(error) || respErrConstants.ERROR_500_MESSAGE,
      error
    );
  }
};

TeamController.getTeamMembers = async (req, res) => {
  try {
    const { id } = req.params;
    const members = await TeamService.getTeamMembers(id);
    return responseWrapper.successResponse(res, 200, members);
  } catch (error) {
    const statusCode = error.message === 'Team not found' ? 404 : 500;
    return responseWrapper.errorResponse(
      res,
      statusCode,
      getErrorMessage(error) || respErrConstants.ERROR_500_MESSAGE,
      error
    );
  }
};

TeamController.addMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, roleId } = req.body;
    const result = await TeamService.addMemberToTeam(id, { userId, roleId });
    return responseWrapper.successResponse(res, 201, result);
  } catch (error) {
    const statusCode = error.message.includes('not found') || error.message.includes('already a member') ? 400 : 500;
    return responseWrapper.errorResponse(
      res,
      statusCode,
      getErrorMessage(error) || respErrConstants.ERROR_500_MESSAGE,
      error
    );
  }
};

TeamController.removeMember = async (req, res) => {
  try {
    const { id, userId } = req.params;
    const result = await TeamService.removeMemberFromTeam(id, userId);
    return responseWrapper.successResponse(res, 200, result);
  } catch (error) {
    const statusCode = error.message === 'Member not found in team' ? 404 : 500;
    return responseWrapper.errorResponse(
      res,
      statusCode,
      getErrorMessage(error) || respErrConstants.ERROR_500_MESSAGE,
      error
    );
  }
};

module.exports = TeamController;
