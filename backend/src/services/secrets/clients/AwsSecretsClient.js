const {
  SecretsManagerClient,
  ListSecretsCommand,
  CreateSecretCommand,
  GetSecretValueCommand,
  UpdateSecretCommand,
  ListSecretVersionIdsCommand,
  DescribeSecretCommand
} = require("@aws-sdk/client-secrets-manager");

const VERSION_STAGE = {
  CURRENT: 'CURRENT',
  PREVIOUS: 'PREVIOUS',
  OLD: 'OLD'
};

class AWSSecretsClient {
  constructor(credentials = null) {
    try {
      console.log("credentials", credentials);
      if (credentials && credentials.accessKeyId && credentials.secretAccessKey && credentials.region) {
        this.manager = new SecretsManagerClient({
          region: credentials.region,
          credentials: {
            accessKeyId: credentials.accessKeyId,
            secretAccessKey: credentials.secretAccessKey,
            sessionToken: "IQoJb3JpZ2luX2VjEOL//////////wEaCmFwLXNvdXRoLTEiRzBFAiEA4vZrFWtonsE5Jzp/h5RvPB5Ymzy2qxWLGBdBPu1y6ZQCIH8bdJoHM4X2ZnHLJeCTWhuNq/c3GhhNpSCMo9VhoeHxKpIDCIv//////////wEQARoMMzM5MDY5NzIxNzYwIgyeNb3x5X4350rgjzcq5gIODzLGI49MuBXjqncFGFd4eGkQY5lG9r8fqHK2zrAiTVxt67IRR51Su3mNrLPGWNYpriLQBN5oQy642DhRa0/rcZkowW0Z+vD602EGGMS/sXQZoXXbOaFGh++VJiF/t8rfuEFKRmZtmGMr0AgqCu+ZvU+udNp6SjywUtAIddXACSlK7gNnDtUuHEeBXaG4dvLfFZ4Z7PfaX5FCLA5lQ7Jiur3y9tRYq/KL9yjXQbJs8Ni+XcgafcfUJWx81m6Vm5RRzRIOoRc/W9FRLcUFwrJWkfPnmzxwczVZqQSaMgPLndSpP3/A6Lk7rwd2etT8FFQ6nMF3AryuCejR6IH/y62cI7Ou86QTcsOtySKqv/5asi8E325uu5K8GUhBUDHhoqFDJ8T+p7Dc56imdwvM8k3IIkuOWxxlZHa2qSSKGSUHLE47w/GuGftgHiOnQwb5hlEwnvLUV0l2+VL8ma1O+ony6Cs714F8MJKOw8cGOqYBgTDALJJEL/9f48rCWmE9H34v0G5LIeJDbZL4vo9pECBzUOuAdH1rmvHk0YzoG0Wh+U+FqgoXnmc03JlRLkgJ02SY2i4HZr8vZIep5/sT/8hFpdpvJvMPaHcCfvxNGoT+6HFWnwys1qWB+XLbbGtRHXZS6b+9r4oRQQ+nAac0HSFsw/tkWqurUOBW3B8MYK14ZKaojsxcdNhrsSRcvGPJISNTuZVJQA=="
          }
        });
      } else {
        throw new Error("Valid credentials (accessKeyId, secretAccessKey, region) are required");
      }
    } catch (err) {
      throw err;
    }
  }

  async create({ name, secret, tags = {}, description }) {
    try {
      const newTags = Object.keys(tags).map(key => ({
        Key: key,
        Value: tags[key]
      }));

      const command = new CreateSecretCommand({
        Name: name,
        Description: description,
        SecretString: JSON.stringify(secret),
        Tags: newTags
      });

      const response = await this.manager.send(command);

      return {
        id: response?.ARN,
        name: response?.Name,
        current_version_id: response?.VersionId
      };
    } catch (err) {
      throw err;
    }
  }

  async get({ secretId, versionId }) {
    try {
      const opts = { SecretId: secretId };
      if (versionId) opts.VersionId = versionId;

      const command = new GetSecretValueCommand(opts);
      const descCommand = new DescribeSecretCommand({ SecretId: secretId });

      const [secret, secretDescription] = await Promise.all([
        this.manager.send(command),
        this.manager.send(descCommand)
      ]);

      const secretValue = secret?.SecretString ? JSON.parse(secret.SecretString) : "";

      return {
        name: secret?.Name,
        secret: secretValue,
        version_id: secret?.VersionId,
        description: secretDescription?.Description,
        tags: secretDescription?.Tags
      };
    } catch (err) {
      throw err;
    }
  }

  async getSecretVersion(secretId, versionId) {
    try {
      const result = await this.get({ secretId, versionId });
      return result;
    } catch (err) {
      throw err;
    }
  }

  async getVersions({ secretId }) {
    try {
      const command = new ListSecretVersionIdsCommand({
        SecretId: secretId,
        IncludeDeprecated: false
      });

      const resp = await this.manager.send(command);
      const labelledVersions = resp?.Versions || [];
      const newVersions = [];

      labelledVersions.forEach(version => {
        let versionStage = VERSION_STAGE.OLD;
        if (version?.VersionStages) {
          if (version.VersionStages[0] === "AWSPREVIOUS") {
            versionStage = VERSION_STAGE.PREVIOUS;
          } else if (version.VersionStages[0] === "AWSCURRENT") {
            versionStage = VERSION_STAGE.CURRENT;
          }
        }

        newVersions.push({
          version_id: version?.VersionId,
          version_stage: versionStage,
          created_at: version?.CreatedDate,
          last_accessed_date: version?.LastAccessedDate
        });
      });

      let versions = [];
      let nextToken;

      do {
        const GetDeprecatedCommand = new ListSecretVersionIdsCommand({
          SecretId: secretId,
          IncludeDeprecated: true,
          MaxResults: 100,
          NextToken: nextToken
        });

        const response = await this.manager.send(GetDeprecatedCommand);
        nextToken = response?.NextToken;
        const newDeprecatedVersions = response?.Versions || [];
        versions = versions.concat(newDeprecatedVersions);
      } while (nextToken);

      const filteredVersions = versions.filter(version => {
        if (version?.VersionStages) {
          if (version.VersionStages[0] === "AWSPREVIOUS") return false;
          if (version.VersionStages[0] === "AWSCURRENT") return false;
        }
        return true;
      });

      const deprecatedVersions = [];
      filteredVersions.forEach(version => {
        deprecatedVersions.push({
          version_id: version?.VersionId,
          version_stage: VERSION_STAGE.OLD,
          created_at: version?.CreatedDate,
          last_accessed_date: version?.LastAccessedDate
        });
      });

      deprecatedVersions.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      return {
        id: resp?.ARN,
        name: resp?.Name,
        versions: [...newVersions, ...deprecatedVersions]
      };
    } catch (err) {
      throw err;
    }
  }

  async update({ secretId, secret, description }) {
    try {
      const opts = {
        SecretId: secretId,
        SecretString: JSON.stringify(secret)
      };

      if (description) opts.Description = description;

      const command = new UpdateSecretCommand(opts);
      const response = await this.manager.send(command);

      return {
        id: response?.ARN,
        name: response?.Name,
        current_version_id: response?.VersionId
      };
    } catch (err) {
      throw err;
    }
  }

  async list() {
    try {
      const command = new ListSecretsCommand({});
      const response = await this.manager.send(command);
      const secretList = response?.SecretList || [];

      const newSecretList = secretList.map(secret => {
        const secretVersions = secret?.SecretVersionsToStages || {};
        let currentVersion, lastVersion;

        Object.keys(secretVersions).forEach(key => {
          if (secretVersions[key][0] === 'AWSCURRENT') {
            currentVersion = key;
          }
          if (secretVersions[key][0] === 'AWSPREVIOUS') {
            lastVersion = key;
          }
        });

        return {
          id: secret?.ARN,
          name: secret?.Name,
          created_date: secret?.CreatedDate,
          last_access_date: secret?.LastAccessedDate,
          last_changed_date: secret?.LastChangedDate,
          tags: secret?.Tags,
          description: secret?.Description,
          current_version_id: currentVersion,
          last_version_id: lastVersion
        };
      });

      return newSecretList;
    } catch (err) {
      throw err;
    }
  }

  async revertToVersion({ secretId, currentVersion, revertToVersion }) {
    try {
      const [currentVersionSecret, revertToVersionSecret] = await Promise.all([
        this.get({ secretId, versionId: currentVersion }),
        this.get({ secretId, versionId: revertToVersion })
      ]);

      const newSecret = await this.update({
        secretId: secretId,
        secret: revertToVersionSecret.secret,
        description: currentVersionSecret.description
      });

      return {
        id: newSecret.id,
        name: newSecret.name,
        newLastVersion: currentVersion,
        newCurrentVersion: newSecret.current_version_id
      };
    } catch (err) {
      throw err;
    }
  }
}

module.exports = AWSSecretsClient;
