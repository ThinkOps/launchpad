const EnvironmentProvider = require('../../dataProviders/environmentProvider');

class EnvironmentService {
         async create(data) {
           try {
             // Validate required fields
             this.validateCreateData(data);

             // Check if environment with same name already exists in the organization
             const existingEnvironment = await EnvironmentProvider.findByNameAndOrgId(data.name, data.org_id);
             if (existingEnvironment) {
               throw new Error(`Environment with name '${data.name}' already exists in this organization`);
             }

             const environment = await EnvironmentProvider.create(data);
             return environment;
           } catch (error) {
             throw error;
           }
         }

  async getById(id) {
    try {
      const environment = await EnvironmentProvider.findById(id);
      if (!environment) {
        throw new Error('Environment not found');
      }
      return environment;
    } catch (error) {
      throw error;
    }
  }

  async listByOrganisationId(orgId) {
    try {
      const environments = await EnvironmentProvider.findByOrganisationId(orgId);
      return environments;
    } catch (error) {
      throw error;
    }
  }

  async listByCloudAccountId(cloudAccountId) {
    try {
      const environments = await EnvironmentProvider.findByCloudAccountId(cloudAccountId);
      return environments;
    } catch (error) {
      throw error;
    }
  }

  async list() {
    try {
      const environments = await EnvironmentProvider.findAll();
      return environments;
    } catch (error) {
      throw error;
    }
  }

  async update(id, data) {
    try {
      // Validate update data
      this.validateUpdateData(data);
      
      // Check if environment exists
      const existingEnvironment = await EnvironmentProvider.findById(id);
      if (!existingEnvironment) {
        throw new Error('Environment not found');
      }

      // If name is being updated, check for duplicates
      if (data.name && data.name !== existingEnvironment.name) {
        const duplicateEnvironment = await EnvironmentProvider.findByNameAndOrgId(
          data.name, 
          existingEnvironment.org_id
        );
        if (duplicateEnvironment) {
          throw new Error(`Environment with name '${data.name}' already exists in this organization`);
        }
      }

      const updatedEnvironment = await EnvironmentProvider.update(id, data);
      return updatedEnvironment;
    } catch (error) {
      throw error;
    }
  }

  async remove(id) {
    try {
      const deleted = await EnvironmentProvider.delete(id);
      return deleted;
    } catch (error) {
      throw error;
    }
  }

  async getEnvironmentStats(orgId) {
    try {
      const totalEnvironments = await EnvironmentProvider.countByOrganisationId(orgId);
      return {
        totalEnvironments,
        orgId
      };
    } catch (error) {
      throw error;
    }
  }

  validateCreateData(data) {
    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
      throw new Error('Environment name is required and must be a non-empty string');
    }
    
    if (!data.cloud_account_id || typeof data.cloud_account_id !== 'string') {
      throw new Error('Cloud account ID is required');
    }
    
    if (!data.org_id || typeof data.org_id !== 'string') {
      throw new Error('Organization ID is required');
    }
    
    if (data.name.length > 255) {
      throw new Error('Environment name must be less than 255 characters');
    }
    
    // Validate metadata if provided
    if (data.metadata !== null && data.metadata !== undefined) {
      if (typeof data.metadata !== 'object') {
        throw new Error('Metadata must be a valid JSON object');
      }
    }
  }

  validateUpdateData(data) {
    if (data.name !== undefined) {
      if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
        throw new Error('Environment name must be a non-empty string');
      }
      
      if (data.name.length > 255) {
        throw new Error('Environment name must be less than 255 characters');
      }
    }
    
    // Validate metadata if provided
    if (data.metadata !== undefined) {
      if (data.metadata !== null && typeof data.metadata !== 'object') {
        throw new Error('Metadata must be a valid JSON object or null');
      }
    }
  }
}

module.exports = new EnvironmentService();
