const CloudAccount  = require('../db/models/cloudAccount');

const CloudAccountDataProvider = {
  create: async (data) => CloudAccount.create(data),

  findById: async (id) => CloudAccount.findByPk(id, { raw: true }),

  findAll: async () => CloudAccount.findAll({ raw: true }),

  findByOrganisationId: async (organisationId) => {
    const response =  await CloudAccount.findAll({
      where: { organisation_id: organisationId },
      raw: true,
    });
    return response;
  },

  updateById: async (id, payload) => {
    const [affected] = await CloudAccount.update(payload, { where: { id } });
    return affected;
  },

  deleteById: async (id) => CloudAccount.destroy({ where: { id } }),

  findByProvider: async (provider) =>
    CloudAccount.findAll({
      where: { provider },
      raw: true
    }),

  findByAccountIdentifier: async (accountIdentifier) =>
    CloudAccount.findOne({
      where: { account_identifier: accountIdentifier },
      raw: true
    }),
};

module.exports = CloudAccountDataProvider;
