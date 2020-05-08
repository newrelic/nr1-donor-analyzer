## Usage

The intention of Donor Analyzer is to view the impact site performance has on donor behavior over a period of time. User can view nr1-donor-analyzer uses the `PageView` events in New Relic to interrogate and categorize the performance of a web site and associated sessions for a user determined timeslice. You can explore the performance of individual pages, and forecast how improving performance impacts KPIs like bounce rate and traffic. This analysis is based on moving individual browsing sessions from `Tolerated` and `Frustrated` into `Satisfied` (as defined by the [`apdex`](https://docs.newrelic.com/docs/apm/new-relic-apm/apdex/apdex-measure-user-satisfaction) value for a given New Relic donor application).

### Impacted Donors

- Table shows individual session data for sessions in the selected timeslice that were marked as `Frustrated`
- Columns can be sorted accending or decending

### Frustrated Giving
Frustrated Giving shows the estimated dollar value of giving that is put at risk through sessions marked as frusterated in the following formula

 Number of `Frustrated` sessions * average donation * .9 = Furstrated Giving.


### Configuration & Set Up
The Donor Analyzer can be set up to consume a unique CRM ID passed as a custom attribute through the [`Browser Agent`](https://docs.newrelic.com/docs/browser/new-relic-browser/browser-agent-spa-api/set-custom-attribute). You can then configure which attribute to display in the Impacted Donor table using the Edit Settings gear under the Frustrated Giving Section.

#### Average Donation
By clicking the Edit Settings, the Average Donation amount can be edited. This number is designed to represent the value of the average giving transaction on your website.

#### Salesforce Link Support
Donor Analyzer supports linking of your custom CRM attribute to your unique Salesforce instance. When configured, it turns the cofigured CRM attribute into a live link to the donor's CRM profile.

In the settings Modal, the dropdown selection provides options for Salesforce or HubSpot CRM. Once selected your organization name can be keyed into the CRM URL path.

> Note that this NerdPack is not served as a launcher on the homepage of [New Relic One](https://one.newrelic.com). Instead, you'll have to navigate to a donor app via the Entity Explorer in New Relic One.

## Open Source License

This project is distributed under the [Apache 2 license](LICENSE).

## Dependencies

Requires [`New Relic Browser`](https://newrelic.com/products/browser-monitoring).

## Getting started

First, ensure that you have [Git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git) and [NPM](https://www.npmjs.com/get-npm) installed. If you're unsure whether you have one or both of them installed, run the following command(s) (If you have them installed these commands will return a version number, if not, the commands won't be recognized):

```bash
git --version
npm -v
```

Next, install the [NR1 CLI](https://one.newrelic.com/launcher/developer-center.launcher) by going to [this link](https://one.newrelic.com/launcher/developer-center.launcher) and following the instructions (5 minutes or less) to install and setup your New Relic development environment.

Next, to clone this repository and run the code locally against your New Relic data, execute the following command:

```bash
nr1 nerdpack:clone -r https://github.com/newrelic/nr1-donor-analyzer.git
cd nr1-donor-analyzer
nr1 nerdpack:serve
```

Visit [https://one.newrelic.com/?nerdpacks=local](https://one.newrelic.com/?nerdpacks=local), navigate to the Nerdpack, and :sparkles:

## Deploying this Nerdpack

Open a command prompt in the nerdpack's directory and run the following commands.

```bash
# To create a new uuid for the nerdpack so that you can deploy it to your account:
nr1 nerdpack:uuid -g [--profile=your_profile_name]

# To see a list of APIkeys / profiles available in your development environment:
# nr1 profiles:list
nr1 nerdpack:publish [--profile=your_profile_name]
nr1 nerdpack:deploy [-c [DEV|BETA|STABLE]] [--profile=your_profile_name]
nr1 nerdpack:subscribe [-c [DEV|BETA|STABLE]] [--profile=your_profile_name]
```

Visit [https://one.newrelic.com](https://one.newrelic.com), navigate to the Nerdpack, and :sparkles:

## Community Support

New Relic hosts and moderates an online forum where you can interact with New Relic employees as well as other customers to get help and share best practices. Like all New Relic open source community projects, there's a related topic in the New Relic Explorers Hub. You can find this project's topic/threads here:

[https://discuss.newrelic.com/t/nerdpack-donor-analyzer/101177](https://discuss.newrelic.com/t/nerdpack-donor-analyzer/101177)

https://discuss.newrelic.com/t/nerdpack-donor-analyzer/101177

## Issues / Enhancement Requests

Issues and enhancement requests can be submitted in the [Issues tab of this repository](../../issues). Please search for and review the existing open issues before submitting a new issue.

## Contributing

Contributions are welcome (and if you submit a Enhancement Request, expect to be invited to contribute it yourself :grin:). Please review our [Contributors Guide](CONTRIBUTING.md).

Keep in mind that when you submit your pull request, you'll need to sign the CLA via the click-through using CLA-Assistant. If you'd like to execute our corporate CLA, or if you have any questions, please drop us an email at opensource@newrelic.com.

