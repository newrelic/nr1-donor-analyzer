import React from 'react';
import PropTypes from 'prop-types';
import {
  BlockText,
  Grid,
  GridItem,
  HeadingText,
  Spinner,
  NerdGraphQuery,
  navigation,
  Toast,
  PlatformStateContext,
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableRowCell,
  Icon,
  Modal,
  Select,
  SelectItem,
  TextField,
  Button,
  EntityStorageQuery,
  EntityStorageMutation,
  TableChart
} from 'nr1';
import { get } from 'lodash';
import numeral from 'numeral';
import { saveAs } from 'file-saver';
import CohortTolerated from './cohort-tolerated';
import CohortSatisifed from './cohort-satisfied';
import CohortFrustrated from './cohort-frustrated';
import SummaryBar from './summary-bar';
import { timeRangeToNrql, NerdGraphError } from '@newrelic/nr1-community';
import { getIconType } from '../utils';
import { generateCohortsQuery } from '../utils/queries';
import { buildResults, buildGivingRisk } from './stat-utils';
import DimensionPicker from './dimensionPicker';
import NrqlFactory from '../nrql-factory';

export default class Breakdown extends React.PureComponent {
  static propTypes = {
    entity: PropTypes.object.isRequired,
    nrqlFactory: PropTypes.instanceOf(NrqlFactory).isRequired,
    nerdletUrlState: PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);

    this.state = {
      sortingType: TableHeaderCell.SORTING_TYPE.ASCENDING,
      sortedColumn: 0,
      showConfig: false,
      eventType: 'PageView',
      donationValue: '',
      crm: null,
      domain: '',
      crmAttribute: {
        key: 'asdf'
      }
    };

    this.toggleSortingType = this.toggleSortingType.bind(this);
    // this._setAccount = this._setAccount.bind(this);
    // this._setDimension = this._setDimension.bind(this);
    // this._setEventType = this._setEventType.bind(this);
    this._selectAttribute = this._selectAttribute.bind(this);
    this._setDonationValue = this._setDonationValue.bind(this);
    this._setDonorAnalyzer = this._setDonorAnalyzer.bind(this);
    this._showDonor = this._showDonor.bind(this);
    this._handleCrmSelect = this._handleCrmSelect.bind(this);
    this._setDomain = this._setDomain.bind(this);
  }

  async componentDidMount() {
    const { entityGuid } = this.props.nerdletUrlState;

    EntityStorageQuery.query({
      entityGuid: entityGuid,
      collection: 'donor-analyzer-db'
    })
      .then(res => {
        if (Array.isArray(res.data) && res.data.length) {
          const { crmAttr, value, crm, domain } = res.data[0].document;
          this.setState({
            donationValue: value,
            crmAttribute: crmAttr,
            crm: crm,
            domain: domain
          });
        } else {
          this.setState({ showConfig: true });
        }
      })
      .catch(err => {
        // console.log(err);
        Toast.showToast({
          title: 'Unable to fetch data',
          description: err.message || '',
          type: Toast.TYPE.CRITICAL
        });
      });

    if (entityGuid) {
      await this.loadEntity();
    } else {
      // get all user accessible accounts
      const gql = `{actor {accounts {name id}}}`;
      const { data } = await NerdGraphQuery.query({ query: gql });
      const { accounts } = data.actor;
      const account = accounts.length > 0 && accounts[0];
      this.setState({ accounts, account });
    }
  }

  async loadEntity() {
    const { entityGuid } = this.props.nerdletUrlState;

    if (entityGuid) {
      // to work with mobile and browser apps, we need the
      // (non guid) id's for these applications, since guid is
      // not present in events like PageView, MobileSession, etc.
      const gql = `{
        actor {
          entity(guid: "${entityGuid}") {
            account {
              name
              id
            }
            name
            domain
            type
            guid
            ... on MobileApplicationEntity {
              applicationId
            }
            ... on BrowserApplicationEntity {
              applicationId
            }
            ... on ApmApplicationEntity {
              applicationId
            }
          }
        }
      }`;

      const { data } = await NerdGraphQuery.query({
        query: gql,
        fetchPolicyType: NerdGraphQuery.FETCH_POLICY_TYPE.NO_CACHE
      });
      const { entity } = data.actor;
      await this.setState({ entity, account: entity.account });
    } else {
      this.setState({ entity: null });
    }
  }

  _openDetails(pageUrl) {
    const { entity } = this.props;
    navigation.openStackedNerdlet({
      id: 'details',
      urlState: {
        pageUrl,
        entityGuid: entity.guid
      }
    });
  }

  _getCrmList() {
    return [
      {
        name: 'SalesForce',
        url: `https://${this.state.domain}.my.salesforce.com`
      },
      {
        name: 'HubSpot',
        url: `https://hubspot.com/${this.state.domain}`
      }
    ];
  }

  toggleSortingType(sortedColumn) {
    this.setState(prevState => {
      return {
        sortedColumn: sortedColumn,
        sortingType:
          prevState.sortingType === TableHeaderCell.SORTING_TYPE.DESCENDING
            ? TableHeaderCell.SORTING_TYPE.ASCENDING
            : TableHeaderCell.SORTING_TYPE.DESCENDING
      };
    });
  }

  renderTopPeformanceTableItems(data) {
    return data.map((item, index) => {
      const pageUrl = item.name;
      const pageCount = item.results[0].count;
      const averageDuration = item.results[1].average.toFixed(2);
      const apdex = item.results[2].score.toFixed(2);

      const output = {
        pageUrl,
        pageCount,
        averageDuration,
        apdex,
        columnIndex: index
      };

      return output;
    });
  }

  renderTopPerformanceTable(data) {
    return (
      <Table
        className="performance-improvement-table"
        spacingType={[Table.SPACING_TYPE.LARGE, Table.SPACING_TYPE.NONE]}
        items={this.renderTopPeformanceTableItems(data.facets)}
      >
        <TableHeader>
          <TableHeaderCell
            value={({ item }) => item.pageUrl}
            sortable
            onClick={(event, sortingData, sortedColumn = 0) => {
              this.toggleSortingType(sortedColumn);
            }}
            sortingOrder={0}
            sortingType={
              this.state.sortedColumn === 0 ? this.state.sortingType : undefined
            }
          >
            Page URL
          </TableHeaderCell>
          <TableHeaderCell
            alignmentType={TableRowCell.ALIGNMENT_TYPE.RIGHT}
            width="130px"
            value={({ item }) => item.pageCount}
            sortable
            onClick={(event, sortingData, sortedColumn = 1) => {
              this.toggleSortingType(sortedColumn);
            }}
            sortingOrder={1}
            sortingType={
              this.state.sortedColumn === 1 ? this.state.sortingType : undefined
            }
          >
            Page Count
          </TableHeaderCell>
          <TableHeaderCell
            alignmentType={TableRowCell.ALIGNMENT_TYPE.RIGHT}
            width="130px"
            value={({ item }) => item.averageDuration}
            sortable
            onClick={(event, sortingData, sortedColumn = 2) => {
              this.toggleSortingType(sortedColumn);
            }}
            sortingOrder={2}
            sortingType={
              this.state.sortedColumn === 2 ? this.state.sortingType : undefined
            }
          >
            Avg. duration
          </TableHeaderCell>
          <TableHeaderCell
            alignmentType={TableRowCell.ALIGNMENT_TYPE.RIGHT}
            width="80px"
            value={({ item }) => item.apdex}
            sortable
            onClick={(event, sortingData, sortedColumn = 3) => {
              this.toggleSortingType(sortedColumn);
            }}
            sortingOrder={3}
            sortingType={
              this.state.sortedColumn === 3 ? this.state.sortingType : undefined
            }
          >
            Apdex
          </TableHeaderCell>
        </TableHeader>
        {({ item }) => (
          <TableRow
            actions={[
              {
                iconType: Icon.TYPE.INTERFACE__INFO__INFO,
                label: 'View details for this page',
                onClick: () => this._openDetails(item.pageUrl)
              }
            ]}
          >
            <TableRowCell onClick={() => this._openDetails(item.pageUrl)}>
              {item.pageUrl}
            </TableRowCell>
            <TableRowCell alignmentType={TableRowCell.ALIGNMENT_TYPE.RIGHT}>
              {item.pageCount}
            </TableRowCell>
            <TableRowCell alignmentType={TableRowCell.ALIGNMENT_TYPE.RIGHT}>
              {item.averageDuration}
            </TableRowCell>
            <TableRowCell alignmentType={TableRowCell.ALIGNMENT_TYPE.RIGHT}>
              {item.apdex}
            </TableRowCell>
          </TableRow>
        )}
      </Table>
    );
  }

  async downloadFrustrated(timePickerRange) {
    const { crmAttribute, crm, domain } = this.state;
    const { entity, nrqlFactory, nerdletUrlState } = this.props;
    const { pageUrl } = nerdletUrlState;

    const query = generateCohortsQuery({
      entity,
      pageUrl,
      timePickerRange,
      nrqlFactory,
      crmAttribute
    });

    if (!crm || !domain) {
      Toast.showToast({
        title: 'Please configure your CRM URL in Settings',
        type: Toast.TYPE.CRITICAL,
        sticky: true
      });
      return null;
    }

    const results = await NerdGraphQuery.query({ query });
    const data = results.data.actor.account.frustratedSessions.results;
    const formattedData = `"${
      crmAttribute.key
    }", "session", "duration", "deviceType"\n${data
      .map(r => {
        return `"${[
          r[crmAttribute.key],
          r.session,
          r.duration,
          r.deviceType
        ].join('","')}"`;
      })
      .join('\n')}`;

    const blob = new Blob([formattedData], {
      // type: 'application/json;charset=utf-8',
      type: 'application/csv;charset=utf-8',
      autoBom: true
    });

    const fileName = `${Date.now()}-frustrated-constituents.csv`;
    saveAs(blob, fileName);
  }

  _setDonorAnalyzer() {
    const { entity } = this.props;
    const { donationValue, crmAttribute, crm, domain } = this.state;

    if (
      isNaN(donationValue) ||
      donationValue < 0 ||
      crmAttribute == null ||
      crm == null ||
      domain === ''
    ) {
      Toast.showToast({
        title: 'Please reconfigure your app',
        description: '',
        type: Toast.TYPE.CRITICAL
      });
      return false;
    }

    EntityStorageMutation.mutate({
      entityGuid: entity.guid,
      actionType: EntityStorageMutation.ACTION_TYPE.WRITE_DOCUMENT,
      collection: 'donor-analyzer-db',
      documentId: 'settings',
      document: {
        value: donationValue,
        crmAttr: crmAttribute,
        crm: crm,
        domain: domain
      }
    })
      .then(() => this.setState({ showConfig: false }))
      .catch(err => {
        // console.log(err);
        Toast.showToast({
          title: 'Unable to save settings',
          description: err.message || '',
          type: Toast.TYPE.CRITICAL
        });
      });
  }

  _showDonor(data) {
    const { crm, domain } = this.state;
    if (!crm || !domain) {
      Toast.showToast({
        title: 'Please configure your CRM URL in Settings',
        type: Toast.TYPE.CRITICAL,
        sticky: true
      });
      return null;
    }

    window.open(`${crm.url}/${data}`, '_blank');
  }

  _handleCrmSelect(event, value) {
    this.setState({ crm: value });
  }

  _updateCrmUrl() {
    const crmList = this._getCrmList();
    const { crm } = this.state;

    // loop through list of CRMs looking for match
    // if list match selected crm, update state crm value
    for (const key in crmList) {
      if (crm.name === crmList[key].name) {
        // console.log('match', crm, crmList[key]);
        this.setState(prevState => ({
          crm: {
            ...prevState.crm,
            url: crmList[key].url
          }
        }));
      }
    }
  }

  _setDomain(value) {
    this.setState(
      {
        domain: value
      },
      () => this._updateCrmUrl()
    );
  }

  _setDonationValue(e) {
    this.setState({ donationValue: e.target.value });
  }

  _selectAttribute(attr) {
    this.setState({ crmAttribute: attr });
  }

  render() {
    const { entity, nrqlFactory, nerdletUrlState } = this.props;
    const { showConfig, crmAttribute, donationValue } = this.state;
    const crmList = this._getCrmList();

    if (!entity) {
      return <Spinner fillContainer />;
    }

    return (
      <PlatformStateContext.Consumer>
        {platformUrlState => {
          const { pageUrl } = nerdletUrlState;
          const timePickerRange = timeRangeToNrql(platformUrlState);
          const query = generateCohortsQuery({
            entity,
            pageUrl,
            timePickerRange,
            nrqlFactory,
            crmAttribute
          });

          return (
            <NerdGraphQuery query={query}>
              {({ data, loading, error }) => {
                if (loading) {
                  return <Spinner fillContainer />;
                }

                if (error) {
                  Toast.showToast({
                    title: 'An error occurred.',
                    type: Toast.TYPE.CRITICAL,
                    sticky: true
                  });

                  return (
                    <div className="error">
                      <HeadingText>An error occurred</HeadingText>
                      <BlockText>
                        We recommend reloading the page and sending the error
                        content below to the Nerdpack developer.
                      </BlockText>
                      <NerdGraphError error={error} />
                    </div>
                  );
                }
                const results = buildResults(data.actor.account);
                const givingRisk = buildGivingRisk(
                  results.frustrated.sessions,
                  donationValue,
                  results.frustrated.bounceRate
                );

                const {
                  settings: { apdexTarget },
                  servingApmApplicationId
                } = entity;
                const frustratedApdex = Math.round(apdexTarget * 4 * 10) / 10;
                const browserSettingsUrl = `https://rpm.newrelic.com/accounts/${entity.accountId}/browser/${servingApmApplicationId}/edit#/settings`;
                const apmService = get(
                  data,
                  'actor.entity.relationships[0].source.entity'
                );
                if (apmService) {
                  apmService.iconType = getIconType(apmService);
                }

                return (
                  <>
                    {showConfig && (
                      <Modal
                        onClose={() => this.setState({ showConfig: false })}
                      >
                        <HeadingText>Donor Analyzer Setup</HeadingText>
                        <Select
                          onChange={this._handleCrmSelect}
                          value={this.state.crm}
                          label="Please select your CRM"
                        >
                          <SelectItem>Select your crm</SelectItem>
                          {crmList.map(crm => (
                            <SelectItem key={crm.name} value={crm}>
                              {crm.name}
                            </SelectItem>
                          ))}
                        </Select>
                        {this.state.crm && (
                          <div>
                            <TextField
                              label="Please specify your domain"
                              spacingType={[TextField.SPACING_TYPE.MEDIUM]}
                              placeholder="Please enter your domain"
                              value={this.state.domain}
                              onChange={e => this._setDomain(e.target.value)}
                            />
                            <div>{this.state.crm.url}</div>
                          </div>
                        )}
                        <TextField
                          label="Please enter your average donation amount."
                          spacingType={[TextField.SPACING_TYPE.MEDIUM]}
                          placeholder="0.00"
                          value={this.state.donationValue}
                          onChange={this._setDonationValue}
                        />
                        <DimensionPicker
                          {...this.props}
                          {...this.state}
                          platformUrlState={platformUrlState}
                          selectAttribute={this._selectAttribute}
                        />
                        <Button
                          spacingType={[Button.SPACING_TYPE.MEDIUM]}
                          onClick={this._setDonorAnalyzer}
                          type={Button.TYPE.PRIMARY}
                          iconType={Button.ICON_TYPE.INTERFACE__SIGN__CHECKMARK}
                        >
                          Store Settings
                        </Button>
                      </Modal>
                    )}
                    {/* {crmAttribute !== null && this.renderDonorAnalyzer({ data })} */}
                    <Grid className="breakdownContainer">
                      <GridItem columnSpan={12}>
                        <SummaryBar {...this.props} apmService={apmService} />
                      </GridItem>
                      <GridItem columnSpan={4} className="cohort satisfied">
                        <CohortSatisifed
                          results={results}
                          pageUrl={pageUrl}
                          browserSettingsUrl={browserSettingsUrl}
                          apdexTarget={apdexTarget}
                        />
                      </GridItem>
                      <GridItem columnSpan={4} className="cohort tolerated">
                        <CohortTolerated
                          results={results}
                          pageUrl={pageUrl}
                          browserSettingsUrl={browserSettingsUrl}
                          apdexTarget={apdexTarget}
                        />
                      </GridItem>
                      <GridItem columnSpan={4} className="cohort frustrated">
                        <CohortFrustrated
                          results={results}
                          pageUrl={pageUrl}
                          browserSettingsUrl={browserSettingsUrl}
                          apdexTarget={apdexTarget}
                        />
                      </GridItem>
                      <BlockText className="cohortsSmallPrint">
                        * Note that these calculations are approximations based
                        on a sample of the total data in New Relic for this
                        Browser application.
                      </BlockText>
                      {/* {pageUrl ? null : (
                        <GridItem className="pageUrlTable" columnSpan={8}>
                          <HeadingText type={HeadingText.TYPE.HEADING3}>
                            Top Performance Improvement Targets
                          </HeadingText>
                          <NrqlQuery
                            accountId={entity.accountId}
                            formatType={NrqlQuery.FORMAT_TYPE.RAW}
                            query={`FROM PageView SELECT  ${
                              crmAttribute.key
                            }, session, duration, deviceType, pageUrl  WHERE appName='${
                              entity.name
                            }' AND duration >= ${frustratedApdex} ${
                              pageUrl ? `WHERE pageUrl = '${pageUrl}'` : ''
                            } limit MAX ${timePickerRange}`}
                          >
                            {({ data }) => {
                              if (data) {
                                return this.renderTopPerformanceTable(data);
                              } else {
                                return '';
                              }
                            }}
                          </NrqlQuery>
                        </GridItem>
                      )} */}

                      {crmAttribute !== null && (
                        <>
                          <GridItem className="pageUrlTable" columnSpan={8}>
                            <HeadingText type={HeadingText.TYPE.HEADING3}>
                              Impacted Donors
                            </HeadingText>
                            <TableChart
                              className="tableChart"
                              accountId={entity.accountId}
                              fullheight
                              fullwidth
                              // eslint-disable-next-line prettier/prettier
                              query={`FROM PageView SELECT  ${crmAttribute.key}, session, duration, deviceType, pageUrl  WHERE appName='${entity.name}' AND duration >= ${frustratedApdex} ${pageUrl ? `WHERE pageUrl = '${pageUrl}'` : ''} limit MAX ${timePickerRange}`}
                              onClickTable={(dataEl, row) => {
                                this._showDonor(row[`${crmAttribute.key}`]);
                              }}
                            />
                          </GridItem>
                          <GridItem
                            columnSpan={4}
                            className="cohort improvement"
                          >
                            <Icon
                              className="icon"
                              type={Icon.TYPE.INTERFACE__STATE__WARNING}
                              color="red"
                            />
                            <h3 className="cohortTitle">Frustrated Giving</h3>
                            <p className="cohortDescription">
                              Based on an average donation of ${donationValue}{' '}
                              and a Frustrated bounce rate of{' '}
                              {results.frustrated.bounceRate}% the{' '}
                              {results.frustrated.sessions} Frustrated sessions
                              place.
                            </p>
                            <div className="cohortStats giving">
                              <div className="givingRisk">
                                <span className="label">Giving at Risk</span>
                                <span className="value">
                                  ${numeral(givingRisk).format('0,0')}
                                </span>
                              </div>
                            </div>
                            <Grid spacingType={[Grid.SPACING_TYPE.NONE]}>
                              <GridItem columnSpan={7} collapseGapAfter>
                                <Button
                                  type={Button.TYPE.PRIMARY}
                                  sizeType={Button.SIZE_TYPE.LARGE}
                                  iconType={
                                    Button.ICON_TYPE
                                      .INTERFACE__OPERATIONS__DOWNLOAD
                                  }
                                  onClick={() =>
                                    this.downloadFrustrated(timePickerRange)
                                  }
                                >
                                  Download Frustrated Visitors
                                </Button>
                              </GridItem>
                              <GridItem columnSpan={5}>
                                <Button
                                  // className="apmButton"
                                  type={Button.TYPE.PLAIN_NEUTRAL}
                                  sizeType={Button.SIZE_TYPE.LARGE}
                                  iconType={
                                    Button.ICON_TYPE
                                      .INTERFACE__OPERATIONS__CONFIGURE
                                  }
                                  onClick={() => {
                                    this.setState({ showConfig: true });
                                  }}
                                >
                                  Edit Settings
                                </Button>
                              </GridItem>
                            </Grid>
                          </GridItem>
                        </>
                      )}
                    </Grid>
                  </>
                );
              }}
            </NerdGraphQuery>
          );
        }}
      </PlatformStateContext.Consumer>
    );
  }
}
