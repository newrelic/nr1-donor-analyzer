const domain = 'REPLACE ME';

const crmConfig = [
  {
    name: 'SalesForce',
    url: `https://${domain}.my.salesforce.com`,
  },
  {
    name: 'HubSpot',
    url: `https://hubspot.com/${domain}`,
  },
];

export const getCrmConfig = () => {
  return crmConfig;
};
