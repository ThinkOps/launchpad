const { Environment } = require('../db/models');

class EnvironmentProvider {
  async create(data) {
    try {
      const environment = await Environment.create(data);
      return environment;
    } catch (error) {
      throw error;
    }
  }

  async findById(id) {
    try {
      const environment = await Environment.findByPk(id, {
        include: [
          {
            association: 'cloudAccount',
            attributes: ['id', 'provider', 'account_name', 'account_identifier']
          },
          {
            association: 'organisation',
            attributes: ['id', 'name']
          }
        ]
      });
      return environment;
    } catch (error) {
      throw error;
    }
  }

  async findByOrganisationId(orgId) {
    try {
      const environments = await Environment.findAll({
        where: { org_id: orgId },
        include: [
          {
            association: 'cloudAccount',
            attributes: ['id', 'provider', 'account_name', 'account_identifier']
          },
          {
            association: 'organisation',
            attributes: ['id', 'name']
          }
        ],
        order: [['created_at', 'DESC']]
      });
      return environments;
    } catch (error) {
      throw error;
    }
  }

  async findByCloudAccountId(cloudAccountId) {
    try {
      const environments = await Environment.findAll({
        where: { cloud_account_id: cloudAccountId },
        include: [
          {
            association: 'cloudAccount',
            attributes: ['id', 'provider', 'account_name', 'account_identifier']
          },
          {
            association: 'organisation',
            attributes: ['id', 'name']
          }
        ],
        order: [['created_at', 'DESC']]
      });
      return environments;
    } catch (error) {
      throw error;
    }
  }

  async findAll() {
    try {
      const environments = await Environment.findAll({
        include: [
          {
            association: 'cloudAccount',
            attributes: ['id', 'provider', 'account_name', 'account_identifier']
          },
          {
            association: 'organisation',
            attributes: ['id', 'name']
          }
        ],
        order: [['created_at', 'DESC']]
      });
      return environments;
    } catch (error) {
      throw error;
    }
  }

  async update(id, data) {
    try {
      const [updatedRowsCount] = await Environment.update(data, {
        where: { id }
      });
      
      if (updatedRowsCount === 0) {
        return null;
      }
      
      const updatedEnvironment = await this.findById(id);
      return updatedEnvironment;
    } catch (error) {
      throw error;
    }
  }

  async delete(id) {
    try {
      const deletedRowsCount = await Environment.destroy({
        where: { id }
      });
      return deletedRowsCount > 0;
    } catch (error) {
      throw error;
    }
  }

  async findByNameAndOrgId(name, orgId) {
    try {
      const environment = await Environment.findOne({
        where: { name, org_id: orgId }
      });
      return environment;
    } catch (error) {
      throw error;
    }
  }

  async countByOrganisationId(orgId) {
    try {
      const count = await Environment.count({
        where: { org_id: orgId }
      });
      return count;
    } catch (error) {
      throw error;
    }
  }

  async countByCloudAccountId(cloudAccountId) {
    try {
      const count = await Environment.count({
        where: { cloud_account_id: cloudAccountId }
      });
      return count;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new EnvironmentProvider();
