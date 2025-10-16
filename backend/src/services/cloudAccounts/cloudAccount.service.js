const cloudAccountProvider = require('../../dataProviders/cloudAccountProvider');
const CloudAccountTestClient = require('./clients/CloudAccountTestClient');

const CloudAccountService = {
  create: async ({ provider, account_name, account_identifier, organisation_id, access_keys, metadata }) => {
    // Validate access_keys format
    if (!Array.isArray(access_keys)) {
      throw new Error('access_keys must be an array');
    }
    
    // Validate each access key has key and value
    for (const key of access_keys) {
      if (!key.key || !key.value) {
        throw new Error('Each access key must have both key and value properties');
      }
    }

    const created = await cloudAccountProvider.create({
      provider,
      account_name,
      account_identifier,
      organisation_id,
      access_keys,
      metadata: metadata || null,
    });

    
    return created.get({ plain: true });
  },

  getById: async (id) => {
    return cloudAccountProvider.findById(id);
  },

  list: async () => {
    return cloudAccountProvider.findAll();
  },

  listByOrganisationId: async (organisationId) => {
    return cloudAccountProvider.findByOrganisationId(organisationId);
  },

  update: async (id, { provider, account_name, account_identifier, access_keys, metadata }) => {
    const updateData = {};
    
    if (provider !== undefined) updateData.provider = provider;
    if (account_name !== undefined) updateData.account_name = account_name;
    if (account_identifier !== undefined) updateData.account_identifier = account_identifier;
    if (metadata !== undefined) updateData.metadata = metadata;
    
    if (access_keys !== undefined) {
      if (!Array.isArray(access_keys)) {
        throw new Error('access_keys must be an array');
      }
      
      // Validate each access key has key and value
      for (const key of access_keys) {
        if (!key.key || !key.value) {
          throw new Error('Each access key must have both key and value properties');
        }
      }
      
      updateData.access_keys = access_keys;
    }

    const affected = await cloudAccountProvider.updateById(id, updateData);
    if (!affected) return null;
    
    return cloudAccountProvider.findById(id);
  },

  remove: async (id) => {
    return cloudAccountProvider.deleteById(id);
  },

  findByProvider: async (provider) => {
    return cloudAccountProvider.findByProvider(provider);
  },

  findByAccountIdentifier: async (accountIdentifier) => {
    return cloudAccountProvider.findByAccountIdentifier(accountIdentifier);
  },

  testConnection: async ({ provider, access_keys }) => {
    try {
      // Validate access_keys format
      if (!Array.isArray(access_keys)) {
        throw new Error('access_keys must be an array');
      }
      
      // Validate each access key has key and value
      for (const key of access_keys) {
        if (!key.key || !key.value) {
          throw new Error('Each access key must have both key and value properties');
        }
      }

      // Extract credentials from access_keys
      const credentials = CloudAccountTestClient.extractCredentialsFromAccessKeys(provider, access_keys);
      
      // Create test client and test connection
      const testClient = new CloudAccountTestClient(provider, credentials);
      const result = await testClient.testConnection();
      
      return result;
    } catch (error) {
      return {
        success: false,
        message: `Connection test failed: ${error.message}`,
        provider: provider,
        error: error.message
      };
    }
  },

  listVpcs: async (cloudAccountId) => {
    try {
      const cloudAccount = await cloudAccountProvider.findById(cloudAccountId);
      if (!cloudAccount) {
        throw new Error('Cloud account not found');
      }

      // Extract credentials from cloud account
      const credentials = CloudAccountTestClient.extractCredentialsFromAccessKeys(
        cloudAccount.provider, 
        cloudAccount.access_keys
      );
      
      // Create test client to list VPCs
      const testClient = new CloudAccountTestClient(cloudAccount.provider, credentials);
      const vpcs = await testClient.listVpcs();
      
      return vpcs;
    } catch (error) {
      throw error;
    }
  },
};

module.exports = CloudAccountService;
