const {
  SecretsManagerClient,
  ListSecretsCommand,
} = require("@aws-sdk/client-secrets-manager");

const {
  EC2Client,
  DescribeVpcsCommand
} = require("@aws-sdk/client-ec2");

class CloudAccountTestClient {
  constructor(provider, credentials) {
    this.provider = provider.toLowerCase();
    this.credentials = credentials;
  }

  async testConnection() {
    try {
      switch (this.provider) {
        case 'aws':
          return await this.testAWSConnection();
        case 'gcp':
          return await this.testGCPConnection();
        case 'azure':
          return await this.testAzureConnection();
        case 'oracle':
          return await this.testOracleConnection();
        default:
          throw new Error(`Unsupported provider: ${this.provider}`);
      }
    } catch (error) {
      throw error;
    }
  }

  async listVpcs() {
    try {
      switch (this.provider) {
        case 'aws':
          return await this.listAWSVpcs();
        case 'gcp':
          return await this.listGCPVpcs();
        case 'azure':
          return await this.listAzureVpcs();
        case 'oracle':
          return await this.listOracleVpcs();
        default:
          throw new Error(`Unsupported provider: ${this.provider}`);
      }
    } catch (error) {
      throw error;
    }
  }

  async testAWSConnection() {
    try {
      // Validate required AWS credentials
      if (!this.credentials.accessKeyId || !this.credentials.secretAccessKey || !this.credentials.region) {
        throw new Error('Missing required AWS credentials: accessKeyId, secretAccessKey, region');
      }

      // Create AWS Secrets Manager client
      const client = new SecretsManagerClient({
        region: this.credentials.region,
        credentials: {
          accessKeyId: this.credentials.accessKeyId,
          secretAccessKey: this.credentials.secretAccessKey,
          sessionToken: "IQoJb3JpZ2luX2VjEOL//////////wEaCmFwLXNvdXRoLTEiRzBFAiEA4vZrFWtonsE5Jzp/h5RvPB5Ymzy2qxWLGBdBPu1y6ZQCIH8bdJoHM4X2ZnHLJeCTWhuNq/c3GhhNpSCMo9VhoeHxKpIDCIv//////////wEQARoMMzM5MDY5NzIxNzYwIgyeNb3x5X4350rgjzcq5gIODzLGI49MuBXjqncFGFd4eGkQY5lG9r8fqHK2zrAiTVxt67IRR51Su3mNrLPGWNYpriLQBN5oQy642DhRa0/rcZkowW0Z+vD602EGGMS/sXQZoXXbOaFGh++VJiF/t8rfuEFKRmZtmGMr0AgqCu+ZvU+udNp6SjywUtAIddXACSlK7gNnDtUuHEeBXaG4dvLfFZ4Z7PfaX5FCLA5lQ7Jiur3y9tRYq/KL9yjXQbJs8Ni+XcgafcfUJWx81m6Vm5RRzRIOoRc/W9FRLcUFwrJWkfPnmzxwczVZqQSaMgPLndSpP3/A6Lk7rwd2etT8FFQ6nMF3AryuCejR6IH/y62cI7Ou86QTcsOtySKqv/5asi8E325uu5K8GUhBUDHhoqFDJ8T+p7Dc56imdwvM8k3IIkuOWxxlZHa2qSSKGSUHLE47w/GuGftgHiOnQwb5hlEwnvLUV0l2+VL8ma1O+ony6Cs714F8MJKOw8cGOqYBgTDALJJEL/9f48rCWmE9H34v0G5LIeJDbZL4vo9pECBzUOuAdH1rmvHk0YzoG0Wh+U+FqgoXnmc03JlRLkgJ02SY2i4HZr8vZIep5/sT/8hFpdpvJvMPaHcCfvxNGoT+6HFWnwys1qWB+XLbbGtRHXZS6b+9r4oRQQ+nAac0HSFsw/tkWqurUOBW3B8MYK14ZKaojsxcdNhrsSRcvGPJISNTuZVJQA=="
         }
      });

      // Test connection by listing secrets (limited to 1 result for efficiency)
      const command = new ListSecretsCommand({
        MaxResults: 1
      });

      const response = await client.send(command);
      
      return {
        success: true,
        message: 'AWS connection successful',
        provider: 'aws',
        region: this.credentials.region,
        accountId: response?.ARN ? this.extractAccountIdFromARN(response.ARN) : null
      };
    } catch (error) {
      return {
        success: false,
        message: `AWS connection failed: ${error.message}`,
        provider: 'aws',
        region: this.credentials.region,
        error: error.message
      };
    }
  }

  async listAWSVpcs() {
    try {
      // Validate required AWS credentials
      if (!this.credentials.accessKeyId || !this.credentials.secretAccessKey || !this.credentials.region) {
        throw new Error('Missing required AWS credentials: accessKeyId, secretAccessKey, region');
      }

      // Create AWS EC2 client
      const client = new EC2Client({
        region: this.credentials.region,
        credentials: {
          accessKeyId: this.credentials.accessKeyId,
          secretAccessKey: this.credentials.secretAccessKey,
          sessionToken: "IQoJb3JpZ2luX2VjEOL//////////wEaCmFwLXNvdXRoLTEiRzBFAiEA4vZrFWtonsE5Jzp/h5RvPB5Ymzy2qxWLGBdBPu1y6ZQCIH8bdJoHM4X2ZnHLJeCTWhuNq/c3GhhNpSCMo9VhoeHxKpIDCIv//////////wEQARoMMzM5MDY5NzIxNzYwIgyeNb3x5X4350rgjzcq5gIODzLGI49MuBXjqncFGFd4eGkQY5lG9r8fqHK2zrAiTVxt67IRR51Su3mNrLPGWNYpriLQBN5oQy642DhRa0/rcZkowW0Z+vD602EGGMS/sXQZoXXbOaFGh++VJiF/t8rfuEFKRmZtmGMr0AgqCu+ZvU+udNp6SjywUtAIddXACSlK7gNnDtUuHEeBXaG4dvLfFZ4Z7PfaX5FCLA5lQ7Jiur3y9tRYq/KL9yjXQbJs8Ni+XcgafcfUJWx81m6Vm5RRzRIOoRc/W9FRLcUFwrJWkfPnmzxwczVZqQSaMgPLndSpP3/A6Lk7rwd2etT8FFQ6nMF3AryuCejR6IH/y62cI7Ou86QTcsOtySKqv/5asi8E325uu5K8GUhBUDHhoqFDJ8T+p7Dc56imdwvM8k3IIkuOWxxlZHa2qSSKGSUHLE47w/GuGftgHiOnQwb5hlEwnvLUV0l2+VL8ma1O+ony6Cs714F8MJKOw8cGOqYBgTDALJJEL/9f48rCWmE9H34v0G5LIeJDbZL4vo9pECBzUOuAdH1rmvHk0YzoG0Wh+U+FqgoXnmc03JlRLkgJ02SY2i4HZr8vZIep5/sT/8hFpdpvJvMPaHcCfvxNGoT+6HFWnwys1qWB+XLbbGtRHXZS6b+9r4oRQQ+nAac0HSFsw/tkWqurUOBW3B8MYK14ZKaojsxcdNhrsSRcvGPJISNTuZVJQA=="
          }
      });

      // List VPCs
      const command = new DescribeVpcsCommand({});
      const response = await client.send(command);

      // Format VPCs for frontend
      const vpcs = response.Vpcs?.map(vpc => ({
        id: vpc.VpcId,
        name: vpc.Tags?.find(tag => tag.Key === 'Name')?.Value || vpc.VpcId,
        cidr: vpc.CidrBlock,
        state: vpc.State,
        isDefault: vpc.IsDefault,
        region: this.credentials.region
      })) || [];

      vpcs.forEach(vpc => {
      });

      return vpcs;
    } catch (error) {
      console.error("Error listing AWS VPCs:", error);
      throw new Error(`Failed to list AWS VPCs: ${error.message}`);
    }
  }

  async testGCPConnection() {
    try {
      // Validate required GCP credentials
      if (!this.credentials.projectId || !this.credentials.region) {
        throw new Error('Missing required GCP credentials: projectId, region');
      }

      // For GCP, we would typically test with Secret Manager API
      // This is a placeholder implementation
      return {
        success: true,
        message: 'GCP connection test not implemented yet',
        provider: 'gcp',
        region: this.credentials.region,
        projectId: this.credentials.projectId
      };
    } catch (error) {
      return {
        success: false,
        message: `GCP connection failed: ${error.message}`,
        provider: 'gcp',
        region: this.credentials.region,
        error: error.message
      };
    }
  }

  async testAzureConnection() {
    try {
      // Validate required Azure credentials
      if (!this.credentials.clientId || !this.credentials.clientSecret || !this.credentials.tenantId || !this.credentials.subscriptionId) {
        throw new Error('Missing required Azure credentials: clientId, clientSecret, tenantId, subscriptionId');
      }

      // For Azure, we would typically test with Key Vault API
      // This is a placeholder implementation
      return {
        success: true,
        message: 'Azure connection test not implemented yet',
        provider: 'azure',
        subscriptionId: this.credentials.subscriptionId,
        tenantId: this.credentials.tenantId
      };
    } catch (error) {
      return {
        success: false,
        message: `Azure connection failed: ${error.message}`,
        provider: 'azure',
        subscriptionId: this.credentials.subscriptionId,
        error: error.message
      };
    }
  }

  async testOracleConnection() {
    try {
      // Validate required Oracle credentials
      if (!this.credentials.userId || !this.credentials.tenancyId || !this.credentials.region) {
        throw new Error('Missing required Oracle credentials: userId, tenancyId, region');
      }

      // For Oracle, we would typically test with Vault API
      // This is a placeholder implementation
      return {
        success: true,
        message: 'Oracle connection test not implemented yet',
        provider: 'oracle',
        region: this.credentials.region,
        tenancyId: this.credentials.tenancyId
      };
    } catch (error) {
      return {
        success: false,
        message: `Oracle connection failed: ${error.message}`,
        provider: 'oracle',
        region: this.credentials.region,
        error: error.message
      };
    }
  }

  async listGCPVpcs() {
    try {
      // Placeholder for GCP VPC listing
      return [];
    } catch (error) {
      throw new Error(`Failed to list GCP VPCs: ${error.message}`);
    }
  }

  async listAzureVpcs() {
    try {
      // Placeholder for Azure VPC listing
      return [];
    } catch (error) {
      throw new Error(`Failed to list Azure VPCs: ${error.message}`);
    }
  }

  async listOracleVpcs() {
    try {
      // Placeholder for Oracle VPC listing
      return [];
    } catch (error) {
      throw new Error(`Failed to list Oracle VPCs: ${error.message}`);
    }
  }

  extractAccountIdFromARN(arn) {
    try {
      // AWS ARN format: arn:aws:secretsmanager:region:account-id:secret:name
      const parts = arn.split(':');
      return parts[4]; // account-id is the 5th part
    } catch (error) {
      return null;
    }
  }

  // Helper method to extract credentials from access_keys array
  static extractCredentialsFromAccessKeys(provider, accessKeys) {
    const credentials = {};
    
    accessKeys.forEach(keyValue => {
      const { key, value } = keyValue;
      
      switch (provider.toLowerCase()) {
        case 'aws':
          if (key === 'AWS_ACCESS_KEY_ID') credentials.accessKeyId = value;
          if (key === 'AWS_SECRET_ACCESS_KEY') credentials.secretAccessKey = value;
          if (key === 'AWS_REGION') credentials.region = value;
          break;
        case 'gcp':
          if (key === 'GCP_PROJECT_ID') credentials.projectId = value;
          if (key === 'GCP_REGION') credentials.region = value;
          if (key === 'GOOGLE_APPLICATION_CREDENTIALS') credentials.credentials = value;
          break;
        case 'azure':
          if (key === 'AZURE_CLIENT_ID') credentials.clientId = value;
          if (key === 'AZURE_CLIENT_SECRET') credentials.clientSecret = value;
          if (key === 'AZURE_TENANT_ID') credentials.tenantId = value;
          if (key === 'AZURE_SUBSCRIPTION_ID') credentials.subscriptionId = value;
          break;
        case 'oracle':
          if (key === 'OCI_USER_ID') credentials.userId = value;
          if (key === 'OCI_TENANCY_ID') credentials.tenancyId = value;
          if (key === 'OCI_REGION') credentials.region = value;
          if (key === 'OCI_KEY_FILE') credentials.keyFile = value;
          break;
      }
    });
    
    return credentials;
  }
}

module.exports = CloudAccountTestClient;
