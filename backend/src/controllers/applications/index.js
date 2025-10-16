const express = require('express');
const ApplicationController = require('./application.controller');
const ValidateRequestErrors = require('../../utils/validateRequestMiddlewares');
const RequestWrapper = require('../../utils/requestWrapper');
const validations = require('./application.validation');

const router = express.Router();

// Application CRUD routes
router.post(
  '/',
  validations.create,
  ValidateRequestErrors(),
  RequestWrapper(ApplicationController.create)
);

router.get(
  '/',
  validations.list,
  ValidateRequestErrors(),
  RequestWrapper(ApplicationController.list)
);

router.get(
  '/:id',
  validations.getById,
  ValidateRequestErrors(),
  RequestWrapper(ApplicationController.getById)
);

// Application secrets routes
router.get(
  '/:applicationName/environments/:environmentName/secrets',
  validations.getSecrets,
  ValidateRequestErrors(),
  RequestWrapper(ApplicationController.getSecrets)
);

router.get(
  '/:applicationName/environments/:environmentName/tags',
  validations.getTags,
  ValidateRequestErrors(),
  RequestWrapper(ApplicationController.getTags)
);

router.put(
  '/:applicationName/environments/:environmentName/secrets',
  validations.updateSecrets,
  ValidateRequestErrors(),
  RequestWrapper(ApplicationController.updateSecrets)
);

router.post(
  '/:applicationName/environments/:environmentName/tags',
  validations.createTag,
  ValidateRequestErrors(),
  RequestWrapper(ApplicationController.createTag)
);

router.delete(
  '/:applicationName/environments/:environmentName/secrets',
  validations.deleteSecret,
  ValidateRequestErrors(),
  RequestWrapper(ApplicationController.deleteSecret)
);

// Version management routes
router.get(
  '/:applicationName/environments/:environmentName/tags/:tagName/versions',
  validations.getSecretVersions,
  ValidateRequestErrors(),
  RequestWrapper(ApplicationController.getSecretVersions)
);

router.post(
  '/:applicationName/environments/:environmentName/revert',
  validations.revertSecret,
  ValidateRequestErrors(),
  RequestWrapper(ApplicationController.revertSecret)
);

// Add environment to application
router.post(
  '/:applicationName/environments',
  RequestWrapper(ApplicationController.addEnvironment)
);

// Initialize secrets for environment
router.post(
  '/:applicationName/environments/:environmentName/secrets/initialize',
  RequestWrapper(ApplicationController.initializeSecrets)
);

module.exports = router;
