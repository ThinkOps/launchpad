const { Application, Organisation, Environment, Tag, Secret, ApplicationEnvironmentTagMapping, CloudAccount } = require('../../db/models');
const secretsService = require('../secrets/secrets.service');
const CloudAccountTestClient = require('../cloudAccounts/clients/CloudAccountTestClient');

class ApplicationService {
  async createApplication({ name, organisationId, environmentIds, metadata = {} }) {
    try {
      // Validate organisation exists
      const organisation = await Organisation.findByPk(organisationId);
      if (!organisation) {
        throw new Error('Organisation not found');
      }

      // Validate environments exist and belong to the organisation
      const environments = await Environment.findAll({
        where: {
          id: environmentIds,
          org_id: organisationId
        },
        include: [{
          model: CloudAccount,
          as: 'cloudAccount'
        }]
      });

      if (environments.length !== environmentIds.length) {
        throw new Error('Some environments not found or do not belong to the organisation');
      }

      // Create the application
      const application = await Application.create({
        name,
        organisation_id: organisationId,
        metadata
      });

      // Create base tag
      const baseTag = await Tag.create({
        name: 'base',
        features: {
          description: 'Base tag for application secrets',
          type: 'base'
        }
      });

      // Create mapping entries and initialize secrets for each environment
      const mappingPromises = environments.map(async (environment) => {
        // Create mapping first
        const mapping = await ApplicationEnvironmentTagMapping.create({
          application_id: application.id,
          tag_id: baseTag.id,
          environment_id: environment.id
        });

        // Initialize secrets in cloud provider
        try {
          const cloudAccount = environment.cloudAccount;
          const credentials = CloudAccountTestClient.extractCredentialsFromAccessKeys(
            cloudAccount.provider, 
            cloudAccount.access_keys
          );

          const secretResult = await secretsService.initializeApplicationSecrets({
            applicationName: name,
            environmentName: environment.name,
            tagName: 'base',
            cloudAccountCredentials: credentials,
            provider: cloudAccount.provider
          });

          // Create secret entry with ARN from cloud provider
          const secret = await Secret.create({
            secret_id: secretResult.id, // Store the ARN here
            current_version_id: secretResult.current_version_id,
            last_version_id: secretResult.current_version_id,
            metadata: {
              application_id: application.id,
              environment_id: environment.id,
              tag_name: 'base',
              secret_name: secretResult.name,
              provider: cloudAccount.provider
            }
          });

          // Update tag with secret reference
          await baseTag.update({
            features: {
              ...baseTag.features,
              secret_id: secret.id
            }
          });

        } catch (secretError) {
          console.error(`Failed to initialize secrets for environment ${environment.name}:`, secretError);
          // Continue with other environments even if one fails
        }

        return mapping;
      });

      await Promise.all(mappingPromises);

      // Return application with populated data
      const createdApplication = await Application.findByPk(application.id, {
        include: [
          {
            model: Organisation,
            as: 'organisation'
          },
          {
            model: ApplicationEnvironmentTagMapping,
            as: 'environmentTagMappings',
            include: [
              {
                model: Environment,
                as: 'environment'
              },
              {
                model: Tag,
                as: 'tag'
              }
            ]
          }
        ]
      });

      return createdApplication;
    } catch (error) {
      throw error;
    }
  }

  async getApplicationsByOrganisation(organisationId) {
    try {
      const applications = await Application.findAll({
        where: { organisation_id: organisationId },
        include: [
          {
            model: Organisation,
            as: 'organisation'
          },
          {
            model: ApplicationEnvironmentTagMapping,
            as: 'environmentTagMappings',
            include: [
              {
                model: Environment,
                as: 'environment',
                include: [
                  {
                    model: CloudAccount,
                    as: 'cloudAccount'
                  }
                ]
              },
              {
                model: Tag,
                as: 'tag'
              }
            ]
          }
        ],
        order: [['created_at', 'DESC']]
      });

      return applications;
    } catch (error) {
      throw error;
    }
  }

  async getAllApplications() {
    try {
      const applications = await Application.findAll({
        include: [
          {
            model: Organisation,
            as: 'organisation'
          },
          {
            model: ApplicationEnvironmentTagMapping,
            as: 'environmentTagMappings',
            include: [
              {
                model: Environment,
                as: 'environment',
                include: [
                  {
                    model: CloudAccount,
                    as: 'cloudAccount'
                  }
                ]
              },
              {
                model: Tag,
                as: 'tag'
              }
            ]
          }
        ],
        order: [['created_at', 'DESC']]
      });

      return applications;
    } catch (error) {
      throw error;
    }
  }

  async getApplicationById(applicationId) {
    try {
      const application = await Application.findByPk(applicationId, {
        include: [
          {
            model: Organisation,
            as: 'organisation'
          },
          {
            model: ApplicationEnvironmentTagMapping,
            as: 'environmentTagMappings',
            include: [
              {
                model: Environment,
                as: 'environment',
                include: [
                  {
                    model: CloudAccount,
                    as: 'cloudAccount'
                  }
                ]
              },
              {
                model: Tag,
                as: 'tag'
              }
            ]
          }
        ]
      });

      if (!application) {
        throw new Error('Application not found');
      }

      return application;
    } catch (error) {
      throw error;
    }
  }

  async getApplicationBaseSecret(applicationId, environmentId) {
    try {
      // Find the base tag mapping for this application and environment
      const applicationTagMapping = await ApplicationEnvironmentTagMapping.findOne({
        where: {
          application_id: applicationId,
          environment_id: environmentId
        },
        include: [
          {
            model: Tag,
            as: 'tag',
            where: { name: 'base' }
          }
        ]
      });

      if (!applicationTagMapping) {
        return {};
      }

      const tagId = applicationTagMapping.tag.id;
      const secretId = applicationTagMapping.tag.features?.secret_id;

      if (!secretId) {
        return {};
      }

      // Get the secret from the database
      const secret = await Secret.findByPk(secretId);

      if (!secret) {
        return {};
      }

      // Get the actual secret data from cloud provider
      const application = await Application.findByPk(applicationId, {
        include: [
          {
            model: ApplicationEnvironmentTagMapping,
            as: 'environmentTagMappings',
            include: [
              {
                model: Environment,
                as: 'environment',
                where: { id: environmentId },
                include: [
                  {
                    model: CloudAccount,
                    as: 'cloudAccount'
                  }
                ]
              }
            ]
          }
        ]
      });

      const environment = application.environmentTagMappings[0]?.environment;
      if (!environment) {
        throw new Error('Environment not found');
      }

      const cloudAccount = environment.cloudAccount;
      const credentials = CloudAccountTestClient.extractCredentialsFromAccessKeys(
        cloudAccount.provider,
        cloudAccount.access_keys
      );

      const secretData = await secretsService.getApplicationSecret({
        applicationName: application.name,
        environmentName: environment.name,
        tagName: 'base',
        cloudAccountCredentials: credentials,
        provider: cloudAccount.provider
      });

      return secretData;
    } catch (error) {
      console.error('Error getting application base secret:', error);
      throw error;
    }
  }

  async getApplicationSecrets(applicationName, environmentName) {
    try {
      // Find the application
      const application = await Application.findOne({
        where: { name: applicationName },
        include: [
          {
            model: ApplicationEnvironmentTagMapping,
            as: 'environmentTagMappings',
            include: [
              {
                model: Environment,
                as: 'environment',
                where: { name: environmentName },
                include: [
                  {
                    model: CloudAccount,
                    as: 'cloudAccount'
                  }
                ]
              },
              {
                model: Tag,
                as: 'tag'
              }
            ]
          }
        ]
      });

      if (!application) {
        throw new Error('Application not found');
      }

      const mappings = application.environmentTagMappings;
      if (mappings.length === 0) {
        return [];
      }

      // Get base secret for inheritance
      const baseSecret = await this.getApplicationBaseSecret(application.id, mappings[0]?.environment?.id);

      // Get secrets for each tag
      const secretsPromises = mappings.map(async (mapping) => {
        const environment = mapping.environment;
        const tag = mapping.tag;
        const cloudAccount = environment.cloudAccount;

        try {
          const credentials = CloudAccountTestClient.extractCredentialsFromAccessKeys(
            cloudAccount.provider, 
            cloudAccount.access_keys
          );

          const secretData = await secretsService.getApplicationSecret({
            applicationName,
            environmentName,
            tagName: tag.name,
            cloudAccountCredentials: credentials,
            provider: cloudAccount.provider
          });

          // If this is the base tag, return as is
          if (tag.name === 'base') {
            return {
              tag_name: tag.name,
              secret_data: {
                secret: secretData.secret,
                current_version_id: secretData.version_id,
                _overwrittenKeys: [],
                _overwrittenKeysMissing: []
              }
            };
          }

          // For non-base tags, merge with base secret
          if (baseSecret && baseSecret.secret) {
            const secretObj = secretData?.secret || {};
            const baseSecretObj = baseSecret.secret || {};
            const overwrittenKeys = new Set();
            const baseSecretKeys = Object.keys(baseSecretObj);
            const secretKeys = Object.keys(secretObj);

            // Create merged secret object and track overwritten keys
            const newSecretObj = {};
            
            // First, add all base secret keys
            for (const key of baseSecretKeys) {
              if (secretObj[key] !== undefined && secretObj[key] !== null && secretObj[key] !== '') {
                // Key exists in tag secret with a non-empty value - use tag's value (NOT overwritten)
                newSecretObj[key] = secretObj[key];
              } else {
                // Key doesn't exist in tag secret OR has empty value - mark as fetched from base
                overwrittenKeys.add(key);
                newSecretObj[key] = baseSecretObj[key];
              }
            }
            
            // Add any additional keys that exist in tag secret but not in base
            for (const key of secretKeys) {
              if (baseSecretObj[key] === undefined) {
                newSecretObj[key] = secretObj[key];
              }
            }

            return {
              tag_name: tag.name,
              secret_data: {
                secret: newSecretObj,
                current_version_id: secretData.version_id,
                _overwrittenKeys: Array.from(overwrittenKeys)
              }
            };
          }

          return {
            tag_name: tag.name,
            secret_data: {
              secret: secretData.secret,
              current_version_id: secretData.version_id,
              _overwrittenKeys: [],
              _overwrittenKeysMissing: []
            }
          };
        } catch (error) {
          console.error(`Failed to get secret for tag ${tag.name}:`, error);
          return {
            tag_name: tag.name,
            secret_data: {
              secret: {},
              current_version_id: null,
              _overwrittenKeys: [],
              _overwrittenKeysMissing: []
            }
          };
        }
      });

      const secrets = await Promise.all(secretsPromises);
      return secrets;
    } catch (error) {
      throw error;
    }
  }

  async getApplicationTags(applicationName, environmentName) {
    try {
      const application = await Application.findOne({
        where: { name: applicationName },
        include: [
          {
            model: ApplicationEnvironmentTagMapping,
            as: 'environmentTagMappings',
            include: [
              {
                model: Environment,
                as: 'environment',
                where: { name: environmentName }
              },
              {
                model: Tag,
                as: 'tag'
              }
            ]
          }
        ]
      });

      if (!application) {
        throw new Error('Application not found');
      }

      const tags = application.environmentTagMappings.map(mapping => ({
        id: mapping.tag.id,
        name: mapping.tag.name,
        features: mapping.tag.features
      }));

      return tags;
    } catch (error) {
      throw error;
    }
  }

  async updateApplicationSecrets(applicationName, environmentName, secretsData) {
    try {
      const application = await Application.findOne({
        where: { name: applicationName },
        include: [
          {
            model: ApplicationEnvironmentTagMapping,
            as: 'environmentTagMappings',
            include: [
              {
                model: Environment,
                as: 'environment',
                where: { name: environmentName },
                include: [
                  {
                    model: CloudAccount,
                    as: 'cloudAccount'
                  }
                ]
              },
              {
                model: Tag,
                as: 'tag'
              }
            ]
          }
        ]
      });

      if (!application) {
        throw new Error('Application not found');
      }

      const updatePromises = secretsData.secrets.map(async (secretUpdate) => {
        const mapping = application.environmentTagMappings.find(
          m => m.tag.name === secretUpdate.tag_name
        );

        if (!mapping) {
          throw new Error(`Tag ${secretUpdate.tag_name} not found for this application`);
        }

        const environment = mapping.environment;
        const cloudAccount = environment.cloudAccount;
        const credentials = CloudAccountTestClient.extractCredentialsFromAccessKeys(
          cloudAccount.provider, 
          cloudAccount.access_keys
        );

        // Get current secret data first
        const currentSecret = await secretsService.getApplicationSecret({
          applicationName,
          environmentName,
          tagName: secretUpdate.tag_name,
          cloudAccountCredentials: credentials,
          provider: cloudAccount.provider
        });

        // Merge current secret with new changes, preserving metadata
        const currentSecretData = currentSecret?.secret || {};
        const currentOverwrittenKeys = new Set(currentSecret?._overwrittenKeys || []);
        const currentOverwrittenKeysMissing = new Set(currentSecret?._overwrittenKeysMissing || []);
        
        // Get base secret to determine which keys are being overwritten
        const baseSecret = await this.getApplicationBaseSecret(applicationName, environmentName);
        const baseSecretData = baseSecret?.secret || {};
        
        // Track which keys are being changed in this update
        const updatedKeys = Object.keys(secretUpdate.secret_data.secret);
        
        // For each updated key, check if it's being changed from base value
        updatedKeys.forEach(key => {
          const newValue = secretUpdate.secret_data.secret[key];
          const baseValue = baseSecretData[key];
          
          // If the new value is different from base value, mark as overwritten
          if (baseValue !== undefined && newValue !== baseValue) {
            currentOverwrittenKeys.add(key);
            currentOverwrittenKeysMissing.delete(key); // Remove from missing if it was there
          }
        });
        
        // Only merge the actual secret values, not the metadata
        const mergedSecretData = {
          ...currentSecretData,
          ...secretUpdate.secret_data.secret
        };

        const result = await secretsService.updateApplicationSecret({
          applicationName,
          environmentName,
          tagName: secretUpdate.tag_name,
          secretData: mergedSecretData,
          cloudAccountCredentials: credentials,
          provider: cloudAccount.provider
        });

        // Create version record for this update
        const secretId = mapping.tag.features?.secret_id;
        if (secretId) {
          await secretsService.createVersionRecord({
            secretId: secretId,
            version: result.current_version_id,
            fromVersion: currentSecret?.version_id,
            operation: 'UPDATE',
            metadata: {
              user_id: secretsData.user_id || null,
              user_name: secretsData.user_name || 'System',
              tag_name: secretUpdate.tag_name,
              updated_keys: updatedKeys
            }
          });
        }

        return result;
      });

      await Promise.all(updatePromises);
      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  async createTagForApplication(applicationName, environmentName, tagData) {
    try {
      const application = await Application.findOne({
        where: { name: applicationName },
        include: [
          {
            model: ApplicationEnvironmentTagMapping,
            as: 'environmentTagMappings',
            include: [
              {
                model: Environment,
                as: 'environment',
                where: { name: environmentName },
                include: [
                  {
                    model: CloudAccount,
                    as: 'cloudAccount'
                  }
                ]
              }
            ]
          }
        ]
      });

      if (!application) {
        throw new Error('Application not found');
      }

      const environment = application.environmentTagMappings[0]?.environment;
      if (!environment) {
        throw new Error('Environment not found for this application');
      }

      // Create new tag
      const tag = await Tag.create({
        name: tagData.name,
        features: {
          description: `Tag for ${applicationName} in ${environmentName}`,
          type: 'custom'
        }
      });

      // Create mapping
      await ApplicationEnvironmentTagMapping.create({
        application_id: application.id,
        tag_id: tag.id,
        environment_id: environment.id
      });

      // Initialize secrets for this new tag
      try {
        const cloudAccount = environment.cloudAccount;
        const credentials = CloudAccountTestClient.extractCredentialsFromAccessKeys(
          cloudAccount.provider, 
          cloudAccount.access_keys
        );

        const secretResult = await secretsService.initializeApplicationSecrets({
          applicationName,
          environmentName,
          tagName: tagData.name,
          cloudAccountCredentials: credentials,
          provider: cloudAccount.provider
        });

        // Create secret entry with ARN from cloud provider
        const secret = await Secret.create({
          secret_id: secretResult.id, // Store the ARN here
          current_version_id: secretResult.current_version_id,
          last_version_id: secretResult.current_version_id,
          metadata: {
            application_id: application.id,
            environment_id: environment.id,
            tag_name: tagData.name,
            secret_name: secretResult.name,
            provider: cloudAccount.provider
          }
        });

        // Update tag with secret reference
        await tag.update({
          features: {
            ...tag.features,
            secret_id: secret.id
          }
        });

      } catch (secretError) {
        console.error(`Failed to initialize secrets for tag ${tagData.name}:`, secretError);
        // Continue even if secret creation fails
      }

      return tag;
    } catch (error) {
      throw error;
    }
  }

  async deleteApplicationSecret(applicationName, environmentName, secretKey) {
    try {
      // This would require implementing secret key deletion in the secrets service
      // For now, we'll just return success
      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  async getApplicationSecretVersions(applicationName, environmentName, tagName) {
    try {
      const application = await Application.findOne({
        where: { name: applicationName },
        include: [
          {
            model: ApplicationEnvironmentTagMapping,
            as: 'environmentTagMappings',
            include: [
              {
                model: Environment,
                as: 'environment',
                where: { name: environmentName },
                include: [
                  {
                    model: CloudAccount,
                    as: 'cloudAccount'
                  }
                ]
              },
              {
                model: Tag,
                as: 'tag',
                where: { name: tagName }
              }
            ]
          }
        ]
      });

      if (!application) {
        throw new Error('Application not found');
      }

      const mapping = application.environmentTagMappings.find(
        m => m.tag.name === tagName
      );

      if (!mapping) {
        throw new Error(`Tag ${tagName} not found for this application`);
      }

      const secretId = mapping.tag.features?.secret_id;
      if (!secretId) {
        throw new Error('Secret not found for this tag');
      }

      // Get version history from entity_versions table
      const versionHistory = await secretsService.getVersionHistory({ secretId });

      // Get versions from cloud provider
      const environment = mapping.environment;
      const cloudAccount = environment.cloudAccount;
      const credentials = CloudAccountTestClient.extractCredentialsFromAccessKeys(
        cloudAccount.provider, 
        cloudAccount.access_keys
      );

      const cloudVersions = await secretsService.getApplicationSecretVersions({
        applicationName,
        environmentName,
        tagName,
        cloudAccountCredentials: credentials,
        provider: cloudAccount.provider
      });

      return {
        id: secretId,
        name: `${applicationName}_${environmentName}_${tagName}`,
        metadata: versionHistory,
        versions: cloudVersions.versions || []
      };
    } catch (error) {
      throw error;
    }
  }

  async getApplicationSecretVersionData(applicationName, environmentName, tagName, versionId) {
    try {
      const application = await Application.findOne({
        where: { name: applicationName },
        include: [
          {
            model: ApplicationEnvironmentTagMapping,
            as: 'environmentTagMappings',
            include: [
              {
                model: Environment,
                as: 'environment',
                where: { name: environmentName },
                include: [
                  {
                    model: CloudAccount,
                    as: 'cloudAccount'
                  }
                ]
              },
              {
                model: Tag,
                as: 'tag',
                where: { name: tagName }
              }
            ]
          }
        ]
      });

      if (!application) {
        throw new Error('Application not found');
      }

      const mapping = application.environmentTagMappings.find(
        m => m.tag.name === tagName
      );

      if (!mapping) {
        throw new Error(`Tag ${tagName} not found for this application`);
      }

      const secretId = mapping.tag.features?.secret_id;
      if (!secretId) {
        throw new Error('Secret not found for this tag');
      }

      // Get the environment and cloud account details
      const environment = mapping.environment;
      const cloudAccount = environment.cloudAccount;
      const credentials = CloudAccountTestClient.extractCredentialsFromAccessKeys(
        cloudAccount.provider, 
        cloudAccount.access_keys
      );

      // Fetch the specific version's secret data from AWS
      const versionSecretData = await secretsService.getApplicationSecretVersion({
        applicationName,
        environmentName,
        tagName,
        versionId,
        cloudAccountCredentials: credentials,
        provider: cloudAccount.provider
      });

      return {
        secret: versionSecretData,
        version_id: versionId,
        tag_name: tagName
      };
    } catch (error) {
      throw error;
    }
  }

  async revertApplicationSecret(applicationName, environmentName, revertData) {
    try {
      const { tag_name, current_version_id, revert_to_version_id } = revertData;

      const application = await Application.findOne({
        where: { name: applicationName },
        include: [
          {
            model: ApplicationEnvironmentTagMapping,
            as: 'environmentTagMappings',
            include: [
              {
                model: Environment,
                as: 'environment',
                where: { name: environmentName },
                include: [
                  {
                    model: CloudAccount,
                    as: 'cloudAccount'
                  }
                ]
              },
              {
                model: Tag,
                as: 'tag',
                where: { name: tag_name }
              }
            ]
          }
        ]
      });

      if (!application) {
        throw new Error('Application not found');
      }

      const mapping = application.environmentTagMappings.find(
        m => m.tag.name === tag_name
      );

      if (!mapping) {
        throw new Error(`Tag ${tag_name} not found for this application`);
      }

      const environment = mapping.environment;
      const cloudAccount = environment.cloudAccount;
      const credentials = CloudAccountTestClient.extractCredentialsFromAccessKeys(
        cloudAccount.provider, 
        cloudAccount.access_keys
      );

      // Revert the secret in cloud provider
      const result = await secretsService.revertApplicationSecret({
        applicationName,
        environmentName,
        tagName: tag_name,
        currentVersion: current_version_id,
        revertToVersion: revert_to_version_id,
        cloudAccountCredentials: credentials,
        provider: cloudAccount.provider
      });

      // Create version record for this revert
      const secretId = mapping.tag.features?.secret_id;
      if (secretId) {
        await secretsService.createVersionRecord({
          secretId: secretId,
          version: result.newCurrentVersion,
          fromVersion: current_version_id,
          operation: 'REVERT',
          metadata: {
            user_id: revertData.user_id || null,
            user_name: revertData.user_name || 'System',
            tag_name: tag_name,
            revertedToVersion: revert_to_version_id
          }
        });
      }

      return result;
    } catch (error) {
      throw error;
    }
  }

  async addEnvironmentToApplication(applicationName, environmentId) {
    try {
      // Find the application
      const application = await Application.findOne({
        where: { name: applicationName },
        include: [
          {
            model: ApplicationEnvironmentTagMapping,
            as: 'environmentTagMappings',
            include: [
              {
                model: Environment,
                as: 'environment'
              }
            ]
          }
        ]
      });

      if (!application) {
        throw new Error('Application not found');
      }

      // Check if environment is already attached
      const existingMapping = application.environmentTagMappings.find(
        mapping => mapping.environment_id === environmentId
      );

      if (existingMapping) {
        throw new Error('Environment is already attached to this application');
      }

      // Find the environment
      const environment = await Environment.findByPk(environmentId, {
        include: [
          {
            model: CloudAccount,
            as: 'cloudAccount'
          }
        ]
      });

      if (!environment) {
        throw new Error('Environment not found');
      }

      // Check if environment belongs to the same organization
      if (environment.org_id !== application.organisation_id) {
        throw new Error('Environment does not belong to the same organization as the application');
      }

      // Find or create base tag for this application
      let baseTag = await Tag.findOne({
        where: {
          name: 'base',
          features: {
            application_id: application.id
          }
        }
      });

      if (!baseTag) {
        baseTag = await Tag.create({
          name: 'base',
          features: {
            description: 'Base tag for application secrets',
            type: 'base',
            application_id: application.id
          }
        });
      }

      // Create mapping
      const mapping = await ApplicationEnvironmentTagMapping.create({
        application_id: application.id,
        tag_id: baseTag.id,
        environment_id: environment.id
      });

      // Initialize secrets for this environment
      try {
        const cloudAccount = environment.cloudAccount;
        if (!cloudAccount) {
          throw new Error('Cloud account not found for environment');
        }

        const credentials = CloudAccountTestClient.extractCredentialsFromAccessKeys(
          cloudAccount.provider, 
          cloudAccount.access_keys
        );

        const secretResult = await secretsService.initializeApplicationSecrets({
          applicationName,
          environmentName: environment.name,
          tagName: 'base',
          cloudAccountCredentials: credentials,
          provider: cloudAccount.provider
        });

        // Create secret entry with ARN from cloud provider
        const secret = await Secret.create({
          secret_id: secretResult.id, // Store the ARN here
          current_version_id: secretResult.current_version_id,
          last_version_id: secretResult.current_version_id,
          metadata: {
            application_id: application.id,
            environment_id: environment.id,
            tag_name: 'base',
            secret_name: secretResult.name,
            provider: cloudAccount.provider
          }
        });

        // Update tag with secret reference
        await baseTag.update({
          features: {
            ...baseTag.features,
            secret_id: secret.id
          }
        });

      } catch (secretError) {
        console.error(`Failed to initialize secrets for environment ${environment.name}:`, secretError);
        // Continue even if secret creation fails
      }

      return {
        success: true,
        environment: environment,
        mapping: mapping
      };
    } catch (error) {
      throw error;
    }
  }

  async initializeEnvironmentSecrets(applicationName, environmentName) {
    try {
      const application = await Application.findOne({
        where: { name: applicationName },
        include: [
          {
            model: ApplicationEnvironmentTagMapping,
            as: 'environmentTagMappings',
            include: [
              {
                model: Environment,
                as: 'environment',
                where: { name: environmentName },
                include: [
                  {
                    model: CloudAccount,
                    as: 'cloudAccount'
                  }
                ]
              },
              {
                model: Tag,
                as: 'tag',
                where: { name: 'base' }
              }
            ]
          }
        ]
      });

      if (!application) {
        throw new Error('Application not found');
      }

      const mapping = application.environmentTagMappings.find(
        m => m.environment.name === environmentName && m.tag.name === 'base'
      );

      if (!mapping) {
        throw new Error('Environment not found for this application');
      }

      const environment = mapping.environment;
      const cloudAccount = environment.cloudAccount;

      if (!cloudAccount) {
        throw new Error('Cloud account not found for environment');
      }

      const credentials = CloudAccountTestClient.extractCredentialsFromAccessKeys(
        cloudAccount.provider, 
        cloudAccount.access_keys
      );

      const secretResult = await secretsService.initializeApplicationSecrets({
        applicationName,
        environmentName,
        tagName: 'base',
        cloudAccountCredentials: credentials,
        provider: cloudAccount.provider
      });

      // Create or update secret entry
      let secret = await Secret.findOne({
        where: {
          metadata: {
            application_id: application.id,
            environment_id: environment.id,
            tag_name: 'base'
          }
        }
      });

      if (secret) {
        await secret.update({
          secret_id: secretResult.id,
          current_version_id: secretResult.current_version_id,
          last_version_id: secretResult.current_version_id,
          metadata: {
            ...secret.metadata,
            secret_name: secretResult.name,
            provider: cloudAccount.provider
          }
        });
      } else {
        secret = await Secret.create({
          secret_id: secretResult.id,
          current_version_id: secretResult.current_version_id,
          last_version_id: secretResult.current_version_id,
          metadata: {
            application_id: application.id,
            environment_id: environment.id,
            tag_name: 'base',
            secret_name: secretResult.name,
            provider: cloudAccount.provider
          }
        });
      }

      // Update tag with secret reference
      await mapping.tag.update({
        features: {
          ...mapping.tag.features,
          secret_id: secret.id
        }
      });

      return {
        success: true,
        secret: secret
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new ApplicationService();
