const { body, param } = require('express-validator');

module.exports = {
  byId: () => [
    param('id').isUUID().withMessage('Invalid environment ID'),
  ],
  
  createEnvironment: () => [
    body('name')
      .isString()
      .isLength({ min: 1, max: 255 })
      .withMessage('Environment name must be between 1 and 255 characters')
      .custom((value) => {
        if (value.includes(' ')) {
          throw new Error('Environment name cannot contain spaces');
        }
        return true;
      }),
    body('cloud_account_id')
      .isUUID()
      .withMessage('Cloud account ID must be a valid UUID'),
    body('vpcId')
      .optional()
      .isString()
      .withMessage('VPC ID must be a string'),
    body('metadata')
      .optional()
      .isObject()
      .withMessage('Metadata must be an object'),
  ],
  
  updateEnvironment: () => [
    param('id').isUUID().withMessage('Invalid environment ID'),
    body('name')
      .optional()
      .isString()
      .isLength({ min: 1, max: 255 })
      .withMessage('Environment name must be between 1 and 255 characters')
      .custom((value) => {
        if (value && value.includes(' ')) {
          throw new Error('Environment name cannot contain spaces');
        }
        return true;
      }),
    body('cloud_account_id')
      .optional()
      .isUUID()
      .withMessage('Cloud account ID must be a valid UUID'),
    body('vpcId')
      .optional()
      .isString()
      .withMessage('VPC ID must be a string'),
    body('metadata')
      .optional()
      .isObject()
      .withMessage('Metadata must be an object'),
  ],
  
  listByOrganisation: () => [
    param('orgId').isUUID().withMessage('Invalid organisation ID'),
  ],
  
  listByCloudAccount: () => [
    param('cloud_account_id').isUUID().withMessage('Invalid cloud account ID'),
  ],
  
  createUnderOrg: () => [
    param('orgId').isUUID().withMessage('Invalid organisation ID'),
    body('name')
      .isString()
      .isLength({ min: 1, max: 255 })
      .withMessage('Environment name must be between 1 and 255 characters')
      .custom((value) => {
        if (value.includes(' ')) {
          throw new Error('Environment name cannot contain spaces');
        }
        return true;
      }),
    body('cloud_account_id')
      .isUUID()
      .withMessage('Cloud account ID must be a valid UUID'),
    body('vpc_id')
      .optional()
      .isString()
      .withMessage('VPC ID must be a string'),
    body('metadata')
      .optional()
      .isObject()
      .withMessage('Metadata must be an object'),
  ],
  
  getStats: () => [
    param('orgId').isUUID().withMessage('Invalid organisation ID'),
  ],
};
